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
 * Selects Essay relation
 * Note: Official answers (solution) are handled by officialAnswers select
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_ESSAY = {
  questionId: true,
  template: true,
} as const satisfies Prisma.EssaySelect

/**
 * Selects essay type-specific relation for Question
 * Note: Official answers (solution) are handled by officialAnswers select
 *
 * Using const literal with `satisfies` preserves literal types for type inference,
 * allowing reuse for selects, type safety, and payload validation.
 */
const SELECT_ESSAY_QUESTION = {
  essay: {
    select: SELECT_ESSAY,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Runtime function that returns the essay select.
 * For backward compatibility and runtime use.
 */
export const selectEssay = (): Prisma.QuestionSelect => SELECT_ESSAY_QUESTION

/**
 * Selects Essay relation.
 * Exported for composition in official answers selects.
 */
export { SELECT_ESSAY }

/**
 * Selects essay type-specific relation for Question.
 * Exported for composition in type-specific index.
 */
export { SELECT_ESSAY_QUESTION }
