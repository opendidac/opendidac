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
import { withAuthorization } from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import {
  withEvaluationPhase,
  withStudentStatus,
} from '@/middleware/withStudentEvaluation'
import { getUser } from '@/core/auth/auth'
import { grading } from '@/core/grading/engine'

const put = async (ctx) => {
  const { req, res, prisma } = ctx
  const user = await getUser(req, res)
  const userEmail = user.email
  const { evaluationId, questionId } = req.query

  const { value: answer, fieldId: answeredFieldId } = req.body

  const evaluationToQuestion = await prisma.evaluationToQuestion.findUnique({
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
  })

  if (!evaluationToQuestion) {
    console.error(
      `Could not find evaluationToQuestion for evaluationId: ${evaluationId}, questionId: ${questionId}`,
    )
    res.status(400).json({ message: 'Internal Server Error' })
    return
  }

  const { exactMatch } = evaluationToQuestion.question
  if (!exactMatch) {
    console.error(`Question ${questionId} does not have an exact match answer`)
    res.status(400).json({ message: 'Internal Server Error' })
    return
  }
  let expectedField = exactMatch.fields.find((f) => f.id === answeredFieldId)
  if (!expectedField) {
    console.error(
      `Field ${answeredFieldId} does not belong to question ${questionId}`,
    )
    res.status(400).json({ message: 'Internal Server Error' })
    return
  }

  // Update the student's answer for that field
  await prisma.studentAnswerExactMatchField.update({
    where: {
      fieldId_userEmail_questionId: {
        fieldId: answeredFieldId,
        userEmail: userEmail,
        questionId: questionId,
      },
    },
    data: {
      value: answer,
    },
  })

  // Update the student's answer status
  await prisma.studentAnswer.update({
    where: {
      userEmail_questionId: {
        userEmail: userEmail,
        questionId: questionId,
      },
    },
    data: {
      // As soon as modifications start, question is considered in progress
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
}

export default withApiContext({
  PUT: withAuthorization(
    withEvaluationPhase(
      withStudentStatus(put, {
        statuses: [UserOnEvaluationStatus.IN_PROGRESS],
      }),
      { phases: [EvaluationPhase.IN_PROGRESS] },
    ),
    { roles: [Role.PROFESSOR, Role.STUDENT] },
  ),
})
