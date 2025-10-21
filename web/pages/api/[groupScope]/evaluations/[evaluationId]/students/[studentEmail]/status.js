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
import { Role, UserOnEvaluationStatus } from '@prisma/client'

import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

// update the status of a student in an evaluation
const put = async (req, res, prisma) => {
  const { evaluationId, studentEmail } = req.query

  const { status } = req.body

  const userOnEvaluationStatus = Object.values(UserOnEvaluationStatus)

  if (!userOnEvaluationStatus.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' })
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: {
      id: evaluationId,
    },
  })

  if (!evaluation) {
    return res.status(404).json({ message: 'Evaluation not found' })
  }

  const student = await prisma.userOnEvaluation.findUnique({
    where: {
      userEmail_evaluationId: {
        userEmail: studentEmail,
        evaluationId,
      },
    },
  })

  if (!student) {
    return res.status(404).json({ message: 'Student not found' })
  }

  const updatedStudent = await prisma.userOnEvaluation.update({
    where: {
      userEmail_evaluationId: {
        userEmail: studentEmail,
        evaluationId,
      },
    },
    data: {
      status,
      finishedAt:
        status === UserOnEvaluationStatus.FINISHED ? new Date() : null,
    },
  })

  res.status(200).json(updatedStudent)
}

export default withGroupScope(
  withMethodHandler({
    PUT: withAuthorization(withPrisma(put), [Role.PROFESSOR]),
  }),
)
