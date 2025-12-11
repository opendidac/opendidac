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
import { SELECT_WEB } from '../typeSpecific/web'

/**
 * Selects the official answers *inside the web relation only*.
 * Merges base SELECT_WEB with solution data (solutionHtml, solutionCss, solutionJs).
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_OFFICIAL_ANSWERS_WEB = {
  ...SELECT_WEB,
  solutionHtml: true,
  solutionCss: true,
  solutionJs: true,
} as const satisfies Prisma.WebSelect

/**
 * Complete web select wrapped in Question structure.
 * Combines base web fields with official answers (solutionHtml, solutionCss, solutionJs).
 *
 * Extracted from SELECT_OFFICIAL_ANSWERS to avoid duplication.
 */
const SELECT_WEB_MERGED_QUESTION = {
  web: {
    select: SELECT_OFFICIAL_ANSWERS_WEB,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Selects the official answers *inside the web relation only*.
 * Exported for composition in officialAnswers index.
 */
export { SELECT_OFFICIAL_ANSWERS_WEB }

/**
 * Complete web select wrapped in Question structure.
 * Exported for use in question copying where full web structure is needed.
 */
export { SELECT_WEB_MERGED_QUESTION }
