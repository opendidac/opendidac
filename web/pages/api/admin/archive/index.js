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

import { Role, EvaluationPhase, ArchivalPhase } from '@prisma/client'
import {
  withAuthorization,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

/** Administrating evaluation data in regards to the archive
 *
 * get: list all evaluations for all groups

 */

const get = async (ctx, args) => {
  const { req, res, prisma } = ctx
  const { mode = 'todo' } = req.query

  // Build mode-specific where conditions
  const getWhereCondition = (mode) => {
    const baseCondition = {
      phase: {
        in: [
          EvaluationPhase.IN_PROGRESS,
          EvaluationPhase.GRADING,
          EvaluationPhase.FINISHED,
        ],
      },
    }

    switch (mode) {
      case 'todo':
        // Active evaluations, marked for archival with deadline breach, and archived ones
        return {
          ...baseCondition,
          OR: [
            { archivalPhase: ArchivalPhase.ACTIVE },
            {
              archivalPhase: ArchivalPhase.MARKED_FOR_ARCHIVAL,
              archivalDeadline: { lt: new Date() }, // Deadline passed
            },
            { archivalPhase: ArchivalPhase.ARCHIVED },
          ],
        }
      case 'pending':
        // Marked for archival but not yet in deadline breach
        return {
          ...baseCondition,
          archivalPhase: ArchivalPhase.MARKED_FOR_ARCHIVAL,
          OR: [
            { archivalDeadline: null }, // No deadline set
            { archivalDeadline: { gte: new Date() } }, // Deadline not passed
          ],
        }
      case 'done':
        // Purged and purged without archive
        return {
          ...baseCondition,
          archivalPhase: {
            in: [ArchivalPhase.PURGED, ArchivalPhase.PURGED_WITHOUT_ARCHIVAL],
          },
        }
      default:
        return baseCondition
    }
  }

  // Build mode-specific ordering
  const getOrderBy = (mode) => {
    switch (mode) {
      case 'todo':
        // Oldest first - prioritize evaluations waiting longest for action
        return { createdAt: 'asc' }

      case 'pending':
        // Earliest deadline first, then by creation date
        return [{ archivalDeadline: 'asc' }, { createdAt: 'asc' }]

      case 'done':
        // Most recently completed first - prioritize purged then archived
        return [
          { purgedAt: 'desc' },
          { archivedAt: 'desc' },
          { createdAt: 'desc' },
        ]

      default:
        return { createdAt: 'desc' }
    }
  }

  const evaluations = await prisma.evaluation.findMany({
    where: getWhereCondition(mode),
    select: {
      id: true,
      label: true,
      phase: true,
      archivalPhase: true,
      createdAt: true,
      updatedAt: true,
      startAt: true,
      endAt: true,
      durationActive: true,
      durationHours: true,
      durationMins: true,
      status: true,
      archivedAt: true,
      archivedByUserEmail: true,
      archivalDeadline: true,
      purgedAt: true,
      purgedByUserEmail: true,
      group: {
        select: {
          id: true,
          label: true,
          scope: true,
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      archivedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      purgedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          evaluationToQuestions: true,
          students: true,
        },
      },
    },
    orderBy: getOrderBy(mode),
  })
  res.status(200).json(evaluations)
}

export default withMethodHandler({
  GET: withAuthorization(withPrisma(get), {
    roles: [Role.SUPER_ADMIN, Role.ARCHIVIST],
  }),
})
