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
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

/**
 * List of tags of a group
 *
 * GET behaviors:
 * - Default: list tags of a group used by the question filtering by tags autocomplete
 * - Optional query param `selected`: returns tags with usage counts, AND-conditioned by selected tags.
 *   Frontend is responsible for applying any display limits/slicing.
 *   Query params:
 *     - selected: CSV of currently selected tags (AND semantics)
 */

const get = async (req, res, prisma) => {
  const { groupScope, selected } = req.query

  const selectedTags = selected ? selected.split(',').filter(Boolean) : []

  const baseQuestionWhere = {
    group: { scope: groupScope },
    AND: selectedTags.length
      ? [
          {
            AND: selectedTags.map((tag) => ({
              questionToTag: {
                some: {
                  label: { equals: tag, mode: 'insensitive' },
                },
              },
            })),
          },
        ]
      : undefined,
  }

  const grouped = await prisma.questionToTag.groupBy({
    by: ['label'],
    where: {
      question: baseQuestionWhere,
      tag: { group: { scope: groupScope } },
    },
    _count: { questionId: true },
    orderBy: { _count: { questionId: 'desc' } },
  })

  const result = grouped.map((g) => ({
    label: g.label,
    count: g._count.questionId,
  }))

  res.status(200).json(result)
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
  }),
)
