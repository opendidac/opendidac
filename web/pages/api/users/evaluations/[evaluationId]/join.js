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
import { withPrisma } from '@/middleware/withPrisma'
import {
  withMethodHandler,
  withAuthorization,
} from '@/middleware/withAuthorization'
import { withRestrictions } from '@/middleware/withRestrictions'
import {
  Role,
  QuestionType,
  StudentPermission,
  CodeQuestionType,
} from '@prisma/client'
import { isJoinable } from '@/code/phase'
import { questionIncludeClause } from '@/code/questions'
import { grading } from '@/code/grading/engine'
import { getUser } from '@/code/auth/auth'

const post = async (req, res, prisma) => {
  const { evaluationId } = req.query
  const user = await getUser(req, res)
  const studentEmail = user.email

  const evaluation = await prisma.evaluation.findUnique({
    where: {
      id: evaluationId,
    },
  })

  if (!evaluation) {
    res.status(404).json({ message: 'Not found' })
    return
  }

  if (!isJoinable(evaluation.phase)) {
    // useRestrictions checks if the evaluation phase is after composition phase
    // the join endpoint is also restricted after the IN-PROGRESS phase,
    // while the students that already joined the evaluation are allowed to consult
    res.status(400).json({ message: 'This evaluation is not joinable' })
    return
  }

  // Is users already connected to the evaluation?
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

  await prisma.$transaction(async (prisma) => {
    console.warn(
      `Creating userOnEvaluation for ${studentEmail} on evaluation ${evaluationId}`,
    )
    // connect the users to the evaluation
    userOnEvaluation = await prisma.userOnEvaluation.create({
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

    // get all the questions of the evaluation,
    const evaluationToQuestions = await prisma.evaluationToQuestion.findMany({
      where: {
        evaluationId: evaluationId,
      },
      include: {
        question: {
          include: questionIncludeClause({
            includeTypeSpecific: true,
            includeOfficialAnswers: true,
          }),
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    // create empty answers and gradings for each questions
    for (const jstq of evaluationToQuestions) {
      const { question } = jstq

      // Check if the StudentAnswer already exists
      const existingAnswer = await prisma.studentAnswer.findUnique({
        where: {
          userEmail_questionId: {
            userEmail: studentEmail,
            questionId: question.id,
          },
        },
      })

      if (!existingAnswer) {
        console.warn(
          `Creating student answer for ${studentEmail} on question ${question.id}`,
        )
        const studentAnswer = await prisma.studentAnswer.create({
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
            await prisma.studentAnswerEssay.update({
              where: {
                userEmail_questionId: {
                  userEmail: studentEmail,
                  questionId: question.id,
                },
              },
              data: {
                content: question.essay.template || '',
              },
            })
            break
          case QuestionType.web:
            await prisma.studentAnswerWeb.update({
              where: {
                userEmail_questionId: {
                  userEmail: studentEmail,
                  questionId: question.id,
                },
              },
              data: {
                html: question.web.templateHtml || '',
                css: question.web.templateCss || '',
                js: question.web.templateJs || '',
              },
            })
            break
          case QuestionType.code:
            await prisma.studentAnswerCode.update({
              where: {
                userEmail_questionId: {
                  userEmail: studentEmail,
                  questionId: question.id,
                },
              },
              data: {
                codeType: question.code.codeType,
                ...createCodeTypeSpecificData(question),
              },
            })
            break
          case QuestionType.database:
            await createDatabaseTypeSpecificData(
              prisma,
              studentAnswer,
              question,
            )
            break
          case QuestionType.exactMatch:
            await createExactMatchTypeSpecificData(
              prisma,
              studentAnswer,
              question,
            )
            break
        }
      }
    }
  })

  res.status(200).json(userOnEvaluation)
}

const createCodeTypeSpecificData = (question) => {
  switch (question.code.codeType) {
    case CodeQuestionType.codeReading:
      return createCodeReadingTypeSpecificData(question)
    case CodeQuestionType.codeWriting:
      return createCodeWritingTypeSpecificData(question)
    default:
      return {}
  }
}

const createCodeReadingTypeSpecificData = (question) => {
  return {
    codeReading: {
      create: {
        outputs: {
          create: question.code.codeReading.snippets.map((snippet) => {
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

const createCodeWritingTypeSpecificData = (question) => {
  return {
    codeWriting: {
      create: {
        files: {
          create: question.code.codeWriting.templateFiles.map((codeToFile) => {
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
          }),
        },
      },
    },
  }
}

const createDatabaseTypeSpecificData = async (
  prisma,
  studentAnswer,
  question,
) => {
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
          create: query.queryOutputTests.map((queryOutputTest) => {
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
  prisma,
  studentAnswer,
  question,
) => {
  // Create StudentAnswerExactMatch instance and related fields
  await prisma.studentAnswerExactMatchField.createMany({
    data: question.exactMatch.fields.map((field) => ({
      userEmail: studentAnswer.userEmail,
      questionId: studentAnswer.questionId,
      fieldId: field.id,
      value: '',
    })),
  })
}

export default withMethodHandler({
  POST: withRestrictions(
    withAuthorization(withPrisma(post), [Role.PROFESSOR, Role.STUDENT]),
  ),
})
