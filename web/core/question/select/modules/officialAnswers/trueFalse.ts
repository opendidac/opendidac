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
import { SELECT_TRUE_FALSE } from '../typeSpecific/trueFalse'

/**
 * Selects the official answers *inside the trueFalse relation only*.
 * Merges base SELECT_TRUE_FALSE with solution data (isTrue).
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_OFFICIAL_ANSWERS_TRUE_FALSE = {
  ...SELECT_TRUE_FALSE,
  isTrue: true,
} as const satisfies Prisma.TrueFalseSelect

/**
 * Complete trueFalse select wrapped in Question structure.
 * Combines base trueFalse fields with official answers (isTrue).
 *
 * Extracted from SELECT_OFFICIAL_ANSWERS to avoid duplication.
 */
const SELECT_TRUE_FALSE_MERGED_QUESTION = {
  trueFalse: {
    select: SELECT_OFFICIAL_ANSWERS_TRUE_FALSE,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Selects the official answers *inside the trueFalse relation only*.
 * Exported for composition in officialAnswers index.
 */
export { SELECT_OFFICIAL_ANSWERS_TRUE_FALSE }

/**
 * Complete trueFalse select wrapped in Question structure.
 * Exported for use in question copying where full trueFalse structure is needed.
 */
export { SELECT_TRUE_FALSE_MERGED_QUESTION }
