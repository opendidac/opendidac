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

import { EvaluationPhase, Role, UserOnEvaluationStatus } from '@prisma/client'

import { withAuthorization } from '@/middleware/withAuthorization'
import { withMethodHandler } from '@/middleware/withMethodHandler'
import { withPrisma } from '@/middleware/withPrisma'
import {
  withEvaluationPhase,
  withStudentStatus,
} from '@/middleware/withStudentEvaluation'
import { getUser } from '@/code/auth/auth'

// The student can answer with a comment in some multi-choice setups
const put = async (ctx) => {
  const { req, res, prisma } = ctx
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

  await prisma.studentAnswerMultipleChoice.update({
    where: {
      userEmail_questionId: {
        userEmail: studentEmail,
        questionId: questionId,
      },
    },
    data: {
      comment: comment,
    },
  })

  res.status(200).json({ message: 'Comment updated' })
}

export default withMethodHandler({
  PUT: withAuthorization(
    withPrisma(
      withEvaluationPhase(
        withStudentStatus(put, {
          statuses: [UserOnEvaluationStatus.IN_PROGRESS],
        }),
        { phases: [EvaluationPhase.IN_PROGRESS] },
      ),
    ),
    { roles: [Role.PROFESSOR, Role.STUDENT] },
  ),
})
