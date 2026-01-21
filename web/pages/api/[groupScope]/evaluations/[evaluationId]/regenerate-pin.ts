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

import { NextApiRequest, NextApiResponse } from 'next'
import { Role } from '@prisma/client'
import { withApiContext, IApiContext } from '@/middleware/withApiContext'
import { withAuthorization, withGroupScope } from '@/middleware/withAuthorization'
import { regenerateEvaluationPin } from '@/core/evaluation/generatePin'

/**
 * POST /api/[groupScope]/evaluations/[evaluationId]/regenerate-pin
 * Regenerates the PIN for an evaluation
 * Only professors can regenerate PINs
 */
const post = async (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: IApiContext
) => {
  const { prisma } = ctx
  const { evaluationId } = req.query

  if (!evaluationId || typeof evaluationId !== 'string') {
    return res.status(400).json({ message: 'Evaluation ID is required' })
  }

  try {
    // Check if evaluation exists
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      select: { id: true }
    })

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' })
    }

    // Regenerate PIN
    const newPin = await regenerateEvaluationPin(prisma, evaluationId)

    return res.status(200).json({ pin: newPin })
  } catch (error) {
    console.error('Error regenerating PIN:', error)
    return res.status(500).json({ message: 'Error regenerating PIN' })
  }
}

export default withApiContext({
  POST: withGroupScope(withAuthorization(post, { roles: [Role.PROFESSOR] }))
})
