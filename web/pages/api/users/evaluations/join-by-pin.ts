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
import { withApiContext } from '@/middleware/withApiContext'
import { getUser } from '@/core/auth/auth'
import { IApiContext } from '@/middleware/withApiContext'

/**
 * POST /api/users/evaluations/join-by-pin
 * Allows students to find an evaluation by PIN and get its ID
 * They can then use the existing join endpoint with the evaluation ID
 */
const post = async (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: IApiContext
) => {
  const { prisma } = ctx
  const { pin } = req.body

  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ message: 'PIN is required' })
  }

  // Normalize PIN (uppercase, trim)
  const normalizedPin = pin.toUpperCase().trim()

  if (normalizedPin.length !== 6) {
    return res.status(400).json({ message: 'PIN must be 6 characters' })
  }

  // Get current user
  const user = await getUser(req, res)
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    // Find evaluation by PIN (uniqueness is enforced manually, not at DB level)
    const evaluation = await prisma.evaluation.findFirst({
      where: { pin: normalizedPin },
      select: {
        id: true,
        label: true,
        phase: true,
        status: true,
        groupId: true,
        group: {
          select: {
            scope: true,
            label: true
          }
        }
      }
    })

    if (!evaluation) {
      return res.status(404).json({ message: 'No evaluation found with this PIN' })
    }

    // Return evaluation details so the frontend can redirect to the join page
    return res.status(200).json({
      evaluationId: evaluation.id,
      label: evaluation.label,
      phase: evaluation.phase,
      status: evaluation.status,
      groupScope: evaluation.group.scope,
      groupLabel: evaluation.group.label
    })
  } catch (error) {
    console.error('Error finding evaluation by PIN:', error)
    return res.status(500).json({ message: 'Error finding evaluation' })
  }
}

export default withApiContext({
  POST: post
})
