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
import {
  SELECT_EXACT_MATCH,
  SELECT_EXACT_MATCH_FIELDS,
} from '../typeSpecific/exactMatch'

/**
 * Selects the official answers *inside the exactMatchField relation only*.
 * Merges base SELECT_EXACT_MATCH_FIELDS with solution data (matchRegex).
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_OFFICIAL_ANSWERS_EXACT_MATCH_FIELD = {
  ...SELECT_EXACT_MATCH_FIELDS,
  matchRegex: true,
} as const satisfies Prisma.ExactMatchFieldSelect

/**
 * Selects the official answers *inside the exactMatch relation only*.
 * Merges base SELECT_EXACT_MATCH with solution data (matchRegex in fields).
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_OFFICIAL_ANSWERS_EXACT_MATCH = {
  ...SELECT_EXACT_MATCH,
  fields: {
    ...SELECT_EXACT_MATCH.fields,
    select: SELECT_OFFICIAL_ANSWERS_EXACT_MATCH_FIELD,
  },
} as const satisfies Prisma.ExactMatchSelect

/**
 * Complete exactMatch select wrapped in Question structure.
 * Combines base exactMatch fields with official answers (matchRegex in fields).
 *
 * Extracted from SELECT_OFFICIAL_ANSWERS to avoid duplication.
 */
const SELECT_EXACT_MATCH_MERGED_QUESTION = {
  exactMatch: {
    select: SELECT_OFFICIAL_ANSWERS_EXACT_MATCH,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Selects the official answers *inside the exactMatch relation only*.
 * Exported for composition in officialAnswers index.
 */
export { SELECT_OFFICIAL_ANSWERS_EXACT_MATCH }

/**
 * Complete exactMatch select wrapped in Question structure.
 * Exported for use in question copying where full exactMatch structure is needed.
 */
export { SELECT_EXACT_MATCH_MERGED_QUESTION }
