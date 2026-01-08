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

import { Role } from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import { withEvaluationUpdate } from '@/middleware/withUpdate'

/** Managing the order of the questions in an evaluation */

const put = async (req, res, ctx) => {
  const { prisma } = ctx
  // update the order of the questions in the evaluation
  const { evaluationId } = req.query
  const { questions } = req.body

  // update the order of the questions in the evaluation
  await prisma.$transaction(async (prisma) => {
    for (const [_, evaluationToQuestion] of questions.entries()) {
      await prisma.evaluationToQuestion.update({
        where: {
          evaluationId_questionId: {
            evaluationId: evaluationId,
            questionId: evaluationToQuestion.questionId,
          },
        },
        data: {
          order: evaluationToQuestion.order,
        },
      })
    }
  })

  res.status(200).json({ message: 'OK' })
}

export default withApiContext({
  PUT: withGroupScope(
    withAuthorization(withEvaluationUpdate(put), {
      roles: [Role.PROFESSOR],
    }),
  ),
})
