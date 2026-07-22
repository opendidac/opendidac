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

// The student can answer with a comment in some multi-choice setups
const put = async (req, res, ctx) => {
  const { prisma } = ctx
  const user = await getUser(req, res)
  const studentEmail = user.email
  const { evaluationId, questionId } = req.query

  const { comment } = req.body

  // Get all options including their official answer status,
  // these are used to grade the user's answers
  // WARNING! they should not be returned by the api to the users
  const evaluationToQuestion = await prisma.evaluationToQuestion.findUnique({
    where: {
      evaluationId_questionId: {
        evaluationId: evaluationId,
        questionId: questionId,
      },
    },
  })

  if (!evaluationToQuestion) {
    res.status(400).json({ message: 'Internal Server Error' })
    return
  }

  const updatedMultiChoice = await prisma.studentAnswerMultipleChoice.update({
    where: {
      userEmail_questionId: {
        userEmail: studentEmail,
        questionId: questionId,
      },
    },
    data: {
      comment: comment,
    },
    select: {
      options: {
        select: {
          id: true,
        },
      },
    },
  })

  // A non-empty comment counts as progress; without it the status falls
  // back to the selected options.
  const status =
    comment?.trim() || updatedMultiChoice.options.length > 0
      ? StudentAnswerStatus.IN_PROGRESS
      : StudentAnswerStatus.MISSING

  const updatedStudentAnswer = await prisma.studentAnswer.update({
    where: {
      userEmail_questionId: {
        userEmail: studentEmail,
        questionId: questionId,
      },
    },
    data: {
      status,
    },
    select: {
      status: true,
    },
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
