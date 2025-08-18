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
import { Role, ArchivalPhase } from '@prisma/client'
import {
  withAuthorization,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'
import { getUser } from '@/code/auth/auth'

const post = async (req, res, prisma) => {
  const { evaluationId } = req.query

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    select: {
      id: true,
      label: true,
      archivalPhase: true,
      archivedAt: true,
      purgedAt: true,
    },
  })

  if (!evaluation) {
    res.status(404).json({ message: 'Evaluation not found' })
    return
  }

  // Debug: Log the actual archival phase
  console.log('Evaluation archival phase:', evaluation.archivalPhase)
  console.log('Evaluation archived at:', evaluation.archivedAt)

  // Check if evaluation can be returned to active (use archivalPhase as source of truth)
  if (
    evaluation.archivalPhase !== 'MARKED_FOR_ARCHIVAL' &&
    evaluation.archivalPhase !== 'ARCHIVED' &&
    evaluation.archivalPhase !== 'EXCLUDED_FROM_ARCHIVAL'
  ) {
    res.status(400).json({
      message: `Evaluation cannot be returned to active. Current phase: ${evaluation.archivalPhase}`,
    })
    return
  }

  if (evaluation.archivalPhase === 'PURGED') {
    res
      .status(400)
      .json({
        message: 'Cannot return to active - evaluation data has been purged',
      })
    return
  }

  // Get the user performing the action
  const user = await getUser(req, res)
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  // Update evaluation to return to active state
  const updatedEvaluation = await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      archivalPhase: ArchivalPhase.ACTIVE,
      archivalDeadline: null, // Clear the archival deadline
      purgeDeadline: null, // Clear the purge deadline if coming from archived state
      // Clear exclusion fields if coming from excluded state
      excludedFromArchivalComment: null,
    },
    include: {
      group: true,
    },
  })

  res.status(200).json({
    message: 'Evaluation back to active state successfully',
    evaluation: updatedEvaluation,
  })
}

export default withMethodHandler({
  POST: withAuthorization(withPrisma(post), [Role.SUPER_ADMIN]),
})
