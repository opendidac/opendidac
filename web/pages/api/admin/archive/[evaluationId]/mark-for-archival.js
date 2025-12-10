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
import { withAuthorization } from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import { withEvaluation } from '@/middleware/withEvaluation'
import { getUser } from '@/core/auth/auth'

const post = async (ctx) => {
  const { req, res, prisma, evaluation } = ctx
  const { evaluationId } = req.query
  const { archivalDeadline, notifyOwner } = req.body

  if (evaluation.archivalPhase !== 'ACTIVE') {
    res
      .status(400)
      .json({ message: 'Evaluation is not in active archival phase' })
    return
  }

  // Get the user performing the action
  const user = await getUser(req, res)
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  // Validate archival deadline if provided
  let deadlineDate = null
  if (archivalDeadline) {
    deadlineDate = new Date(archivalDeadline)
    if (isNaN(deadlineDate.getTime())) {
      res.status(400).json({ message: 'Invalid archival deadline' })
      return
    }
    // Allow today as archival date by using start of day comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadline = new Date(deadlineDate)
    deadline.setHours(0, 0, 0, 0)

    if (deadline < today) {
      res
        .status(400)
        .json({ message: 'Archival deadline cannot be in the past' })
      return
    }
  }

  // Update evaluation to mark for archival
  const updatedEvaluation = await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      archivalPhase: ArchivalPhase.MARKED_FOR_ARCHIVAL,
      archivalDeadline: deadlineDate,
    },
    include: {
      group: true,
    },
  })

  // TODO: Send notification to evaluation owner if requested
  if (notifyOwner) {
    console.log(
      `Would notify evaluation owner about archival schedule for evaluation ${evaluationId}`,
    )
    if (deadlineDate) {
      console.log(`Archival deadline: ${deadlineDate.toISOString()}`)
    }
  }

  res.status(200).json({
    message: 'Evaluation marked for archival',
    evaluation: updatedEvaluation,
    archivalDeadline: deadlineDate?.toISOString() || null,
  })
}

export default withApiContext({
  POST: withEvaluation(
    withAuthorization(post, {
      roles: [Role.SUPER_ADMIN, Role.ARCHIVIST],
    }),
  ),
})
