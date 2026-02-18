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

import { Role, EvaluationPhase } from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import { withEvaluationUpdate } from '@/middleware/withUpdate'
import { withEvaluation } from '@/middleware/withEvaluation'
import { withPurgeGuard } from '@/middleware/withPurged'

const put = async (req, res, ctx) => {
  const { prisma, evaluation } = ctx
  // update the evaluationToQuestion
  const { evaluationId, questionId } = req.query
  const body = req.body

  // Fields that can only be updated during COMPOSITION phase
  const compositionOnlyFields = ['points', 'title']
  // Fields that can be updated at any phase
  const alwaysAllowedFields = ['gradingPoints']

  const isCompositionPhase = evaluation.phase === EvaluationPhase.COMPOSITION

  // Determine which fields are allowed based on phase
  const allowedFields = isCompositionPhase
    ? [...compositionOnlyFields, ...alwaysAllowedFields]
    : alwaysAllowedFields

  const data = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key)),
  )

  // Check if trying to update composition-only fields outside composition phase
  const hasCompositionOnlyFields = compositionOnlyFields.some((field) =>
    Object.prototype.hasOwnProperty.call(body, field),
  )
  if (!isCompositionPhase && hasCompositionOnlyFields) {
    res.status(403).json({
      message:
        'Cannot update points or title: evaluation has moved beyond composition phase',
    })
    return
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ message: 'No valid fields to update' })
    return
  }

  await prisma.evaluationToQuestion.update({
    where: {
      evaluationId_questionId: {
        evaluationId: evaluationId,
        questionId: questionId,
      },
    },
    data: data,
  })

  res.status(200).json({ message: 'OK' })
}

const del = async (req, res, ctx) => {
  const { prisma, evaluation } = ctx
  // delete a question from an evaluation
  const { evaluationId, questionId } = req.query

  // Check if evaluation is still in COMPOSITION phase
  if (evaluation.phase !== EvaluationPhase.COMPOSITION) {
    res.status(403).json({
      message:
        'Cannot modify composition: evaluation has moved beyond composition phase',
    })
    return
  }

  // get the order of this question in the evaluation
  const order = await prisma.evaluationToQuestion.findFirst({
    where: {
      AND: [{ evaluationId: evaluationId }, { questionId: questionId }],
    },
    orderBy: {
      order: 'asc',
    },
  })

  if (!order) {
    res.status(404).json({ message: 'question not found' })
    return
  }

  await prisma.$transaction(async (prisma) => {
    // delete the evaluationToQuestion
    await prisma.evaluationToQuestion.delete({
      where: {
        evaluationId_questionId: {
          evaluationId: evaluationId,
          questionId: questionId,
        },
      },
    })
    // decrement the order of all questions that were after the deleted question
    await prisma.evaluationToQuestion.updateMany({
      where: {
        AND: [{ evaluationId: evaluationId }, { order: { gt: order.order } }],
      },
      data: {
        order: {
          decrement: 1,
        },
      },
    })
  })

  res.status(200).json({ message: 'OK' })
}

export default withApiContext({
  PUT: withGroupScope(
    withAuthorization(
      withEvaluation(withPurgeGuard(withEvaluationUpdate(put))),
      {
        roles: [Role.PROFESSOR],
      },
    ),
  ),
  DELETE: withGroupScope(
    withAuthorization(withEvaluation(withEvaluationUpdate(del)), {
      roles: [Role.PROFESSOR],
    }),
  ),
})
