/**
 * Copyright 2022-2024 HEIG-VD
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { withAuthorization } from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import { withRestrictions } from '@/middleware/withRestrictions'
import { withEvaluation } from '@/middleware/withEvaluation'
import type { IApiContext, IApiContextWithEvaluation } from '@/core/types/api'
import {
  Role,
  QuestionType,
  StudentPermission,
  CodeQuestionType,
  Prisma,
  PrismaClient,
} from '@prisma/client'
import { isJoinable } from '@/core/phase'
import { grading } from '@/core/grading/engine'
import { getUser } from '@/core/auth/auth'
import {
  mergeSelects,
  selectBase,
  selectTypeSpecific,
  selectOfficialAnswers,
} from '@/core/question/select'

/**
 * Select clause for student joining evaluation.
 * Includes: type-specific data, official answers (for templates)
 * Note: Does NOT include professor-only info or tags (not needed for student joining)
 */
const selectForStudentJoin = (): Prisma.QuestionSelect => {
  return mergeSelects(
    selectBase({ includeProfessorOnlyInfo: false }),
    selectTypeSpecific(),
    selectOfficialAnswers(),
  )
}

const post = async (ctx: IApiContextWithEvaluation | IApiContext) => {
  const { req, res, prisma } = ctx
  const { evaluationId } = req.query

  if (!evaluationId || typeof evaluationId !== 'string') {
    res.status(400).json({ message: 'Invalid evaluationId' })
    return
  }

  // evaluation is guaranteed to be present when evaluationId is in the URL
  if (!('evaluation' in ctx)) {
    res.status(500).json({ message: 'Evaluation not found in context' })
    return
  }

  const { evaluation } = ctx

  const user = await getUser(req, res)

  if (!user || !user.email) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const studentEmail = user.email

  if (!isJoinable(evaluation.phase)) {
    // useRestrictions checks if the evaluation phase is after composition phase
    // the join endpoint is also restricted after the IN-PROGRESS phase,
    // while the students that already joined the evaluation are allowed to consult
    res.status(400).json({ message: 'This evaluation is not joinable' })
    return
  }

  // Is user already connected to the evaluation?
  let userOnEvaluation = await prisma.userOnEvaluation.findUnique({
    where: {
      userEmail_evaluationId: {
        userEmail: studentEmail,
        evaluationId: evaluationId,
      },
    },
    include: {
      evaluation: {
        select: {
          phase: true,
        },
      },
    },
  })

  if (userOnEvaluation) {
    res.status(200).json(userOnEvaluation)
    return
  }

  await (prisma as PrismaClient).$transaction(
    async (tx: Prisma.TransactionClient) => {
      // connect the user to the evaluation
      userOnEvaluation = await tx.userOnEvaluation.create({
        data: {
          userEmail: studentEmail,
          evaluationId: evaluationId,
        },
        include: {
          evaluation: {
            select: {
              phase: true,
            },
          },
        },
      })

      // get all the questions of the evaluation
      const evaluationToQuestions = await tx.evaluationToQuestion.findMany({
        where: {
          evaluationId: evaluationId,
        },
        include: {
          question: {
            select: selectForStudentJoin(),
          },
        },
        orderBy: {
          order: 'asc',
        },
      })

      // create empty answers and gradings for each question
      for (const jstq of evaluationToQuestions) {
        const { question } = jstq

        // Check if the StudentAnswer already exists
        const existingAnswer = await tx.studentAnswer.findUnique({
          where: {
            userEmail_questionId: {
              userEmail: studentEmail,
              questionId: question.id,
            },
          },
        })

        if (!existingAnswer) {
          const studentAnswer = await tx.studentAnswer.create({
            data: {
              userEmail: studentEmail,
              questionId: question.id,
              [question.type]: {
                create: {}, // good for most question types
              },
              studentGrading: {
                create: grading(question, jstq.points, undefined),
              },
            },
            include: {
              [question.type]: true,
            },
          })

          // Handle type-specific data
          switch (question.type) {
            case QuestionType.essay:
              await tx.studentAnswerEssay.update({
                where: {
                  userEmail_questionId: {
                    userEmail: studentEmail,
                    questionId: question.id,
                  },
                },
                data: {
                  content: question.essay?.template || '',
                },
              })
              break
            case QuestionType.web:
              await tx.studentAnswerWeb.update({
                where: {
                  userEmail_questionId: {
                    userEmail: studentEmail,
                    questionId: question.id,
                  },
                },
                data: {
                  html: question.web?.templateHtml || '',
                  css: question.web?.templateCss || '',
                  js: question.web?.templateJs || '',
                },
              })
              break
            case QuestionType.code:
              await tx.studentAnswerCode.update({
                where: {
                  userEmail_questionId: {
                    userEmail: studentEmail,
                    questionId: question.id,
                  },
                },
                data: {
                  codeType: question.code?.codeType,
                  ...createCodeTypeSpecificData(question),
                },
              })
              break
            case QuestionType.database:
              await createDatabaseTypeSpecificData(tx, studentAnswer, question)
              break
            case QuestionType.exactMatch:
              await createExactMatchTypeSpecificData(
                tx,
                studentAnswer,
                question,
              )
              break
          }
        }
      }
    },
  )

  res.status(200).json(userOnEvaluation)
}

const createCodeTypeSpecificData = (question: any) => {
  if (!question.code) return {}

  switch (question.code.codeType) {
    case CodeQuestionType.codeReading:
      return createCodeReadingTypeSpecificData(question)
    case CodeQuestionType.codeWriting:
      return createCodeWritingTypeSpecificData(question)
    default:
      return {}
  }
}

const createCodeReadingTypeSpecificData = (question: any) => {
  if (!question.code?.codeReading?.snippets) return {}

  return {
    codeReading: {
      create: {
        outputs: {
          create: question.code.codeReading.snippets.map((snippet: any) => {
            return {
              // Student starts with an empty output
              output: '',
              // Connect the output to the corresponding snippet
              codeReadingSnippet: {
                connect: {
                  id: snippet.id,
                },
              },
            }
          }),
        },
      },
    },
  }
}

const createCodeWritingTypeSpecificData = (question: any) => {
  if (!question.code?.codeWriting?.templateFiles) return {}

  return {
    codeWriting: {
      create: {
        files: {
          create: question.code.codeWriting.templateFiles.map(
            (codeToFile: any) => {
              return {
                studentPermission: codeToFile.studentPermission,
                order: codeToFile.order,
                file: {
                  create: {
                    path: codeToFile.file.path,
                    content: codeToFile.file.content,
                    createdAt: codeToFile.file.createdAt,
                    code: {
                      connect: {
                        questionId: question.id,
                      },
                    },
                  },
                },
              }
            },
          ),
        },
      },
    },
  }
}

const createDatabaseTypeSpecificData = async (
  prisma: Prisma.TransactionClient,
  studentAnswer: any,
  question: any,
) => {
  if (!question.database?.solutionQueries) return

  // Create DatabaseQuery and StudentAnswerDatabaseToQuery instances and related outputs
  for (const solQuery of question.database.solutionQueries) {
    const query = solQuery.query

    // Create DatabaseQuery instance and store the generated ID
    const createdQuery = await prisma.databaseQuery.create({
      data: {
        order: query.order,
        title: query.title,
        description: query.description,
        content:
          query.studentPermission === StudentPermission.UPDATE
            ? query.template
            : query.content,
        template: undefined,
        lintActive: query.lintActive,
        lintRules: query.lintRules,
        studentPermission: query.studentPermission,
        testQuery: query.testQuery,
        queryOutputTests: {
          create: query.queryOutputTests.map((queryOutputTest: any) => {
            return {
              test: queryOutputTest.test,
            }
          }),
        },
        database: {
          connect: {
            questionId: question.id,
          },
        },
      },
    })

    // Create a StudentAnswerDatabaseToQuery instance using the ID of the created DatabaseQuery
    await prisma.studentAnswerDatabaseToQuery.create({
      data: {
        queryId: createdQuery.id,
        userEmail: studentAnswer.userEmail,
        questionId: studentAnswer.questionId,
      },
    })
  }
}

const createExactMatchTypeSpecificData = async (
  prisma: Prisma.TransactionClient,
  studentAnswer: any,
  question: any,
) => {
  if (!question.exactMatch?.fields) return

  // Create StudentAnswerExactMatch instance and related fields
  await prisma.studentAnswerExactMatchField.createMany({
    data: question.exactMatch.fields.map((field: any) => ({
      userEmail: studentAnswer.userEmail,
      questionId: studentAnswer.questionId,
      fieldId: field.id,
      value: '',
    })),
  })
}

export default withApiContext({
  POST: withEvaluation(
    withRestrictions(
      withAuthorization(post, {
        roles: [Role.PROFESSOR, Role.STUDENT],
      }),
    ) as any,
  ),
})
