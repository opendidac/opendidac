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
 * Selects ExactMatchField for student answers.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_EXACT_MATCH_FIELD_STUDENT = {
  id: true,
  statement: true,
  matchRegex: true,
  order: true,
} as const satisfies Prisma.ExactMatchFieldSelect

/**
 * Selects ExactMatch student answer field.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_STUDENT_ANSWER_EXACT_MATCH_FIELD = {
  fieldId: true,
  value: true,
  exactMatchField: {
    select: SELECT_EXACT_MATCH_FIELD_STUDENT,
  },
} as const satisfies Prisma.StudentAnswerExactMatchFieldSelect

/**
 * Selects ExactMatch student answers.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_STUDENT_ANSWER_EXACT_MATCH = {
  fields: {
    select: SELECT_STUDENT_ANSWER_EXACT_MATCH_FIELD,
    orderBy: {
      exactMatchField: {
        order: 'asc',
      },
    },
  },
} as const satisfies Prisma.StudentAnswerExactMatchSelect

/**
 * Selects ExactMatch student answers.
 * Exported for composition in student answers index.
 */
export { SELECT_STUDENT_ANSWER_EXACT_MATCH }
