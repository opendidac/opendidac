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

import {
  QuestionType,
  QuestionStatus,
  QuestionSource,
  QuestionUsageStatus,
} from '@prisma/client'

/**
 * Builds a Prisma "where" clause for filtering questions and tags.
 *
 * Accepts the same query parameters used by both:
 *   - /api/[groupScope]/questions
 *   - /api/[groupScope]/questions/tags
 *
 * Returns:
 *   { where: { ... } }
 */
export function questionsFilterWhereClause(query) {
  const {
    groupScope,
    search,
    tags,
    questionTypes,
    codeLanguages,
    questionStatus,
    unused,
  } = query

  // Normalize values
  const status = questionStatus || QuestionStatus.ACTIVE
  const parsedTags = tags ? tags.split(',').filter(Boolean) : []
  const parsedQuestionTypes = questionTypes
    ? questionTypes.split(',').map((t) => QuestionType[t])
    : []
  const parsedCodeLanguages = codeLanguages
    ? codeLanguages.split(',').filter(Boolean)
    : []
  const isUnused = unused === 'true'

  // Base clause
  const where = {
    where: {
      group: { scope: groupScope },
      source: { in: [QuestionSource.BANK, QuestionSource.COPY] },
      status,
      AND: [],
    },
  }

  // Search title/content
  if (search) {
    where.where.AND.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ],
    })
  }

  // Tags filter (AND semantics)
  if (parsedTags.length > 0) {
    where.where.AND.push({
      AND: parsedTags.map((tag) => ({
        questionToTag: {
          some: {
            label: { equals: tag, mode: 'insensitive' },
          },
        },
      })),
    })
  }

  // Question type & language logic
  const withoutCode = parsedQuestionTypes.filter((t) => t !== QuestionType.code)

  if (
    parsedQuestionTypes.includes(QuestionType.code) &&
    parsedCodeLanguages.length > 0
  ) {
    where.where.AND.push({
      OR: [
        { type: { in: withoutCode } },
        {
          AND: [
            { type: QuestionType.code },
            { code: { language: { in: parsedCodeLanguages } } },
          ],
        },
      ],
    })
  } else if (parsedQuestionTypes.length > 0) {
    where.where.AND.push({ type: { in: parsedQuestionTypes } })
  }

  // Unused questions
  if (isUnused) {
    where.where.AND.push({ usageStatus: QuestionUsageStatus.UNUSED })
  }

  // Cleanup empty AND
  if (where.where.AND.length === 0) delete where.where.AND

  return where
}
