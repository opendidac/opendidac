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
  EvaluationPhase,
  Role,
  StudentAnswerStatus,
  UserOnEvaluationStatus,
} from '@prisma/client'
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
import { grading } from '@/code/grading/engine'

const put = withEvaluationPhase(
  [EvaluationPhase.IN_PROGRESS],
  withStudentStatus(
    [UserOnEvaluationStatus.IN_PROGRESS],
    async (req, res, prisma) => {
      const user = await getUser(req, res)
      const userEmail = user.email
      const { evaluationId, questionId } = req.query

      const { field: answer } = req.body

      const evaluationToQuestion = await prisma.evaluationToQuestion.findUnique(
        {
          where: {
            evaluationId_questionId: {
              evaluationId: evaluationId,
              questionId: questionId,
            },
          },
          include: {
            question: {
              include: {
                exactMatch: {
                  select: {
                    fields: true,
                  },
                },
              },
            },
          },
        },
      )

      if (!evaluationToQuestion) {
        res
          .status(400)
          .json({
            message:
              'Internal Server Error: could not find that evaluationToQuestion',
          })
        // TODO, replace with this (and same everywhere in this file):
        // res.status(400).json({ message: 'Internal Server Error' })
        return
      }

      const { exactMach } = evaluationToQuestion.question
      if (!exactMach) {
        res
          .status(400)
          .json({
            message:
              'Internal Server Error: question does not have an exact answer',
          })
      }
      let expectedField = exactMach.fields.find((f) => f.id === answer.fieldId)
      if (!expectedField) {
        res.status(400).json({
          message: 'Internal Server Error: field does not belong to question',
        })
        return
      }

      // Update the student's answer for that field
      await prisma.studentAnswerExactMatchField.update({
        where: {
          fieldId_userEmail_questionId : {
            fieldId: answer.fieldId,
            userEmail: userEmail,
            questionId: questionId,
          },
        },
        data: {
          value: answer.value,
        },
      })

      // Update the student's answer status
      // TODO do I need to set back to MISSING if all fields are empty?
      await prisma.studentAnswer.update({
        where: {
          userEmail_questionId: {
            userEmail: userEmail,
            questionId: questionId,
          },
        },
        data: {
          status: StudentAnswerStatus.IN_PROGRESS,
        },
      })

      // Get the updated user's answer
      const updatedStudentAnswer = await prisma.studentAnswer.findUnique({
        where: {
          userEmail_questionId: {
            userEmail: userEmail,
            questionId: questionId,
          },
        },
        select: {
          status: true,
          exactMatch: {
            include: {
              fields: {
                select: {
                  fieldId: true,
                  value: true,
                },
              },
            },
          },
        },
      })
      const { exactMatch: updatedExactMatch } = updatedStudentAnswer

      // Grade the answer
      const grade = grading(
        evaluationToQuestion.question,
        evaluationToQuestion.points,
        updatedExactMatch,
      )
      await prisma.studentQuestionGrading.upsert({
        where: {
          userEmail_questionId: {
            userEmail: userEmail,
            questionId: questionId,
          },
        },
        create: {
          userEmail: userEmail,
          questionId: questionId,
          ...grade,
        },
        update: grade,
      })

      res.status(200).json(updatedStudentAnswer)
    },
  ),
)

export default withMethodHandler({
  PUT: withAuthorization(withPrisma(put), [Role.PROFESSOR, Role.STUDENT]),
})
