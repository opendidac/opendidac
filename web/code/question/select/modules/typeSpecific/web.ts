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
 * Selects Web relation
 * Note: Official answers (solutionHtml, solutionCss, solutionJs) are handled by officialAnswers select
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_WEB = {
  questionId: true,
  templateHtml: true,
  templateCss: true,
  templateJs: true,
} as const satisfies Prisma.WebSelect

/**
 * Selects web type-specific relation for Question
 * Note: Official answers (solutionHtml, solutionCss, solutionJs) are handled by officialAnswers select
 *
 * Using const literal with `satisfies` preserves literal types for type inference,
 * allowing reuse for selects, type safety, and payload validation.
 */
const SELECT_WEB_QUESTION = {
  web: {
    select: SELECT_WEB,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Runtime function that returns the web select.
 * For backward compatibility and runtime use.
 */
export const selectWeb = (): Prisma.QuestionSelect => SELECT_WEB_QUESTION

/**
 * Selects Web relation.
 * Exported for composition in official answers selects.
 */
export { SELECT_WEB }

/**
 * Selects web type-specific relation for Question.
 * Exported for composition in type-specific index.
 */
export { SELECT_WEB_QUESTION }
