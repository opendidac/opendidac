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
import { questionsFilterWhereClause } from '@/code/questionsFilter'

/**
 * List of tags for a group
 *
 * GET /api/[groupScope]/questions/tags
 *
 * Behaviors:
 * - Returns tags with usage counts, filtered by the same query params as /questions
 * - Supports AND semantics for tags filtering
 *
 * Query params (same as /questions):
 *   - tags: CSV of tag labels (AND filter)
 *   - search
 *   - questionTypes
 *   - codeLanguages
 *   - questionStatus
 *   - unused
 *
 */
const get = async (ctx, args) => {
  const { req, res, prisma } = ctx
  const where = questionsFilterWhereClause(req.query)

  // Group tags from filtered questions
  const grouped = await prisma.questionToTag.groupBy({
    by: ['label'],
    where: {
      question: where.where,
    },
    _count: { label: true },
    orderBy: { _count: { label: 'desc' } },
  })

  // Transform result
  const result = grouped.map((g) => ({
    label: g.label,
    count: g._count.label,
  }))

  res.status(200).json(result)
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), { roles: [Role.PROFESSOR] }),
  }),
)
