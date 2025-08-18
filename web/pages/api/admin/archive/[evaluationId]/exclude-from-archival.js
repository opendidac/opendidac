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
  const { comment } = req.body

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    select: { 
      id: true, 
      label: true,
      archivalPhase: true,
    },
  })

  if (!evaluation) {
    res.status(404).json({ message: 'Evaluation not found' })
    return
  }

  if (evaluation.archivalPhase !== 'ACTIVE') {
    res.status(400).json({ message: 'Can only exclude active evaluations from archival' })
    return
  }

  if (!comment || comment.trim().length === 0) {
    res.status(400).json({ message: 'Comment is required to explain exclusion reason' })
    return
  }

  // Get the user performing the action
  const user = await getUser(req, res)
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  // Update evaluation to exclude from archival
  const updatedEvaluation = await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      archivalPhase: ArchivalPhase.EXCLUDED_FROM_ARCHIVAL,
      excludedFromArchivalAt: new Date(),
      excludedFromArchivalByUserEmail: user.email,
      excludedFromArchivalComment: comment.trim(),
    },
    include: {
      group: true,
      excludedFromArchivalBy: true,
    },
  })

  res.status(200).json({
    message: 'Evaluation excluded from archival successfully',
    evaluation: updatedEvaluation,
  })
}

export default withMethodHandler({
  POST: withAuthorization(withPrisma(post), [Role.SUPER_ADMIN]),
}) 