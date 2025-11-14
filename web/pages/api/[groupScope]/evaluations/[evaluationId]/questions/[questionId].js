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

import { Role, QuestionSource } from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

const put = async (ctx, args) => {
  const { req, res, prisma } = ctx
  const { groupScope, evaluationId, questionId } = req.query
  const { addendum } = req.body

  try {
    // First verify the evaluation to question exists and belongs to the correct group
    const evaluationToQuestion = await prisma.evaluationToQuestion.findFirst({
      where: {
        evaluationId: evaluationId,
        questionId: questionId,
        question: {
          source: QuestionSource.EVAL,
          group: {
            scope: groupScope,
          },
        },
      },
    })

    if (!evaluationToQuestion) {
      return res.status(404).json({
        message: 'Question not found or not part of this evaluation',
      })
    }

    // Then update the addendum in EvaluationToQuestion
    await prisma.evaluationToQuestion.update({
      where: {
        evaluationId_questionId: {
          evaluationId: evaluationId,
          questionId: questionId,
        },
      },
      data: {
        addendum,
      },
    })

    res.status(200).json({ message: 'Addendum updated successfully' })
  } catch (error) {
    console.error('Error updating addendum:', error)
    res.status(500).json({ message: 'Failed to update addendum' })
  }
}

export default withMethodHandler({
  PUT: withGroupScope(
    withAuthorization(withPrisma(put), { roles: [Role.PROFESSOR] }),
  ),
})
