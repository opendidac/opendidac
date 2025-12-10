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
import { SELECT_ESSAY } from '../typeSpecific/essay'

/**
 * Selects the official answers *inside the essay relation only*.
 * Merges base SELECT_ESSAY with solution data (solution).
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_OFFICIAL_ANSWERS_ESSAY = {
  ...SELECT_ESSAY,
  solution: true,
} as const satisfies Prisma.EssaySelect

/**
 * Complete essay select wrapped in Question structure.
 * Combines base essay fields with official answers (solution).
 *
 * Extracted from SELECT_OFFICIAL_ANSWERS to avoid duplication.
 */
const SELECT_ESSAY_MERGED_QUESTION = {
  essay: {
    select: SELECT_OFFICIAL_ANSWERS_ESSAY,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Selects the official answers *inside the essay relation only*.
 * Exported for composition in officialAnswers index.
 */
export { SELECT_OFFICIAL_ANSWERS_ESSAY }

/**
 * Complete essay select wrapped in Question structure.
 * Exported for use in question copying where full essay structure is needed.
 */
export { SELECT_ESSAY_MERGED_QUESTION }
