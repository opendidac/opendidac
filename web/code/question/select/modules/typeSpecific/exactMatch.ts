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

import { Prisma } from '@prisma/client'

/**
 * Selects ExactMatchField relation
 * Note: Official answers (matchRegex) are handled by officialAnswers select
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_EXACT_MATCH_FIELDS = {
  id: true,
  order: true,
  statement: true,
} as const satisfies Prisma.ExactMatchFieldSelect

/**
 * Selects ExactMatch relation
 * Note: Official answers (matchRegex) are handled by officialAnswers select
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_EXACT_MATCH = {
  questionId: true,
  fields: {
    select: SELECT_EXACT_MATCH_FIELDS,
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  },
} as const satisfies Prisma.ExactMatchSelect

/**
 * Selects exact match type-specific relation for Question
 * Note: Official answers (matchRegex) are handled by officialAnswers select
 *
 * Using const literal with `satisfies` preserves literal types for type inference,
 * allowing reuse for selects, type safety, and payload validation.
 */
const SELECT_EXACT_MATCH_QUESTION = {
  exactMatch: {
    select: SELECT_EXACT_MATCH,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Runtime function that returns the exact match select.
 * For backward compatibility and runtime use.
 */
export const selectExactMatch = (): Prisma.QuestionSelect =>
  SELECT_EXACT_MATCH_QUESTION

/**
 * Selects ExactMatchField relation.
 * Exported for composition in official answers selects.
 */
export { SELECT_EXACT_MATCH_FIELDS }

/**
 * Selects ExactMatch relation.
 * Exported for composition in official answers selects.
 */
export { SELECT_EXACT_MATCH }

/**
 * Selects exact match type-specific relation for Question.
 * Exported for composition in type-specific index.
 */
export { SELECT_EXACT_MATCH_QUESTION }
