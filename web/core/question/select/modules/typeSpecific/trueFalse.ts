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
 * Selects TrueFalse relation
 * Note: Official answers (isTrue) are handled by officialAnswers select
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_TRUE_FALSE = {
  questionId: true,
} as const satisfies Prisma.TrueFalseSelect

/**
 * Selects true/false type-specific relation for Question
 * Note: Official answers (isTrue) are handled by officialAnswers select
 *
 * Using const literal with `satisfies` preserves literal types for type inference,
 * allowing reuse for selects, type safety, and payload validation.
 */
const SELECT_TRUE_FALSE_QUESTION = {
  trueFalse: {
    select: SELECT_TRUE_FALSE,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Runtime function that returns the true/false select.
 * For backward compatibility and runtime use.
 */
export const selectTrueFalse = (): Prisma.QuestionSelect =>
  SELECT_TRUE_FALSE_QUESTION

/**
 * Selects TrueFalse relation.
 * Exported for composition in official answers selects.
 */
export { SELECT_TRUE_FALSE }

/**
 * Selects true/false type-specific relation for Question.
 * Exported for composition in type-specific index.
 */
export { SELECT_TRUE_FALSE_QUESTION }
