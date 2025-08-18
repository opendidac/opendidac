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
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

/** Administrating evaluation data in regards to the archive
 *
 * get: list all evaluations for all groups

 */

const get = async (req, res, prisma) => {
  const evaluationsNotPurged = await prisma.evaluation.findMany({
    where: {
      phase: {
        in: [
          EvaluationPhase.IN_PROGRESS,
          EvaluationPhase.GRADING,
          EvaluationPhase.FINISHED,
        ],
      },
    },
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
      excludedFromArchivalAt: true,
      excludedFromArchivalByUserEmail: true,
      excludedFromArchivalComment: true,
      purgedAt: true,
      purgedByUserEmail: true,
      purgeDeadline: true,
      group: {
        select: {
          id: true,
          label: true,
          scope: true,
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
      excludedFromArchivalBy: {
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
    orderBy: {
      createdAt: 'desc',
    },
  })
  res.status(200).json(evaluationsNotPurged)
}

export default withMethodHandler({
  GET: withAuthorization(withPrisma(get), [Role.SUPER_ADMIN]),
})
