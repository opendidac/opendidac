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
import {
  Role,
  StudentAnswerStatus,
  StudentPermission,
  QuestionType,
  EvaluationPhase,
  UserOnEvaluationStatus,
  CodeQuestionType,
} from '@prisma/client'

import { isInProgress } from './utils'
import { grading } from '@/code/grading/engine'
import {
  withAuthorization,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'
import {
  withEvaluationPhase,
  withStudentStatus,
} from '@/middleware/withStudentEvaluation'
import { getUser } from '@/code/auth/auth'

/*
  get the users answers for a question including related nested data
*/

const isCodeReadingQuestionWithStudentOutputTest = (question) =>
  question.type === QuestionType.code &&
  question.code.codeType === CodeQuestionType.codeReading &&
  question.code.codeReading.studentOutputTest

const get = withEvaluationPhase(
  [EvaluationPhase.IN_PROGRESS],
  withStudentStatus(
    [UserOnEvaluationStatus.IN_PROGRESS],
    async (req, res, prisma) => {
      const user = await getUser(req, res)
      const studentEmail = user.email
      const { questionId } = req.query

      // IMPORTANT! Do not provide any official answers to the student
      const question = await prisma.question.findUnique({
        where: {
          id: questionId,
        },
        select: {
          id: true,
          type: true,
          multipleChoice: {
            select: {
              activateStudentComment: true,
              studentCommentLabel: true,
              activateSelectionLimit: true,
              selectionLimit: true,
              options: {
                select: {
                  id: true,
                  order: true,
                  text: true,
                },
              },
            },
          },
          database: {
            select: {
              solutionQueries: {
                where: {
                  query: {
                    testQuery: true,
                  },
                },
                select: {
                  query: {
                    select: {
                      order: true,
                    },
                  },
                  output: true,
                },
              },
            },
          },
          code: {
            select: {
              codeType: true,
              language: true,
              codeReading: {
                select: {
                  studentOutputTest: true,
                },
              },
              codeWriting: {
                select: {
                  codeCheckEnabled: true,
                },
              },
            },
          },
          exactAnswer: {
            select: {
              fields: {
                select: {
                  id: true,
                  statement: true,
                },
              }
            },
          }
        },
      })

      if (!question) {
        res.status(404).json({ message: 'Question not found' })
        return
      }

      const studentAnswer = await prisma.studentAnswer.findUnique({
        where: {
          userEmail_questionId: {
            userEmail: studentEmail,
            questionId: questionId,
          },
        },
        include: {
          code: {
            select: {
              codeType: true,
              codeWriting: {
                select: {
                  files: {
                    where: {
                      studentPermission: {
                        not: StudentPermission.HIDDEN,
                      },
                    },
                    select: {
                      studentPermission: true,
                      order: true,
                      file: true,
                    },
                    orderBy: { order: 'asc' },
                  },
                },
              },
              codeReading: {
                select: {
                  outputs: {
                    select: {
                      output: true,
                      ...(isCodeReadingQuestionWithStudentOutputTest(question)
                        ? {
                            status: true,
                          }
                        : {}),
                      codeReadingSnippet: {
                        select: {
                          id: true,
                          snippet: true,
                          order: true,
                        },
                      },
                    },
                    orderBy: {
                      codeReadingSnippet: {
                        order: 'asc',
                      },
                    },
                  },
                },
              },
            },
          },
          database: {
            select: {
              queries: {
                include: {
                  query: {
                    include: {
                      queryOutputTests: true,
                    },
                  },
                  studentOutput: true,
                },
                orderBy: {
                  query: { order: 'asc' },
                },
              },
            },
          },
          multipleChoice: {
            select: {
              comment: true,
              options: {
                select: {
                  id: true,
                  text: true,
                },
              },
            },
          },
          exactAnswer: {
            select: {
              fields: {
                select: {
                  fieldId: true,
                  value: true,
                },
              },
            },
          },
          trueFalse: true,
          essay: true,
          web: true,
        },
      })

      if (!studentAnswer) {
        res.status(404).json({ message: 'Student answers not found' })
        return
      }

      if (studentAnswer.database) {
        // remove hidden queries content
        studentAnswer.database.queries = studentAnswer.database?.queries.map(
          (saTq) => ({
            ...saTq,
            query: {
              ...saTq.query,
              content:
                saTq.query.studentPermission === StudentPermission.HIDDEN
                  ? null
                  : saTq.query.content,
            },
          }),
        )
      }

      res.status(200).json({
        question,
        studentAnswer,
      })
    },
  ),
)

/*
 endpoint to handle users answers related to all single level question types (without complex nesting)
 ONLY : [true false, essay, web]
 The complexe question types have their own endpoints
*/
const put = withEvaluationPhase(
  [EvaluationPhase.IN_PROGRESS],
  withStudentStatus(
    [UserOnEvaluationStatus.IN_PROGRESS],
    async (req, res, prisma) => {
      // update users answers
      const user = await getUser(req, res)
      const studentEmail = user.email
      const { evaluationId, questionId } = req.query

      const { answer } = req.body
      const questionToEvaluation = await prisma.evaluationToQuestion.findUnique(
        {
          where: {
            evaluationId_questionId: {
              evaluationId: evaluationId,
              questionId: questionId,
            },
          },
          include: {
            question: {
              select: {
                type: true,
                trueFalse: true,
                essay: true,
                web: true,
              },
            },
          },
        },
      )

      if (!(await isInProgress(evaluationId, prisma))) {
        res.status(400).json({ message: 'Evaluation is not in progress' })
        return
      }

      let status =
        answer === undefined
          ? StudentAnswerStatus.MISSING
          : StudentAnswerStatus.IN_PROGRESS

      const transaction = [] // to do in single transaction, queries are done in order

      // update the status of the users answers
      transaction.push(
        prisma.studentAnswer.update({
          where: {
            userEmail_questionId: {
              userEmail: studentEmail,
              questionId: questionId,
            },
          },
          data: {
            status,
          },
        }),
      )

      // update the typeSpecific users answers

      const {
        answer: data,
        grading,
        model,
      } = prepareAnswer(prisma, questionToEvaluation, answer)

      transaction.push(
        model.update({
          where: {
            userEmail_questionId: {
              userEmail: studentEmail,
              questionId: questionId,
            },
          },
          data: data,
        }),
      )

      // update the grading
      transaction.push(
        prisma.studentQuestionGrading.upsert({
          where: {
            userEmail_questionId: {
              userEmail: studentEmail,
              questionId: questionId,
            },
          },
          create: {
            userEmail: studentEmail,
            questionId: questionId,
            ...grading,
          },
          update: grading,
        }),
      )

      await prisma.$transaction(transaction)

      const updatedStudentAnswer = await prisma.studentAnswer.findUnique({
        where: {
          userEmail_questionId: {
            userEmail: studentEmail,
            questionId: questionId,
          },
        },
        select: {
          status: true,
          [questionToEvaluation.question.type]: true,
        },
      })

      res.status(200).json(updatedStudentAnswer)
    },
  ),
)

/*
    prepare the answers and grading for the users answers and select the correct model to update
    this function also insures that no other fields or related entities are changed by the client
*/
const prepareAnswer = (prisma, questionToEvaluation, answer) => {
  const { question } = questionToEvaluation
  switch (question.type) {
    case QuestionType.trueFalse:
      return {
        model: prisma.studentAnswerTrueFalse,
        answer: {
          isTrue: answer ? answer.isTrue : null,
        },
        grading: grading(question, questionToEvaluation.points, answer),
      }
    case QuestionType.essay:
      return {
        model: prisma.studentAnswerEssay,
        answer: {
          content: answer ? String(answer.content) : null,
        },
        grading: grading(question, questionToEvaluation.points, answer),
      }
    case QuestionType.web:
      return {
        model: prisma.studentAnswerWeb,
        answer: {
          css: answer ? answer.css : null,
          html: answer ? answer.html : null,
          js: answer ? answer.js : null,
        },
        grading: grading(question, questionToEvaluation.points, answer),
      }
    default:
      return undefined
  }
}

export default withMethodHandler({
  PUT: withAuthorization(withPrisma(put), [Role.STUDENT, Role.PROFESSOR]),
  GET: withAuthorization(withPrisma(get), [Role.STUDENT, Role.PROFESSOR]),
})
