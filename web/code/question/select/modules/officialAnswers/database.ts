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
import { SELECT_DATABASE } from '../typeSpecific/database'

/**
 * Selects the official answers *inside the database relation only*.
 * Merges base SELECT_DATABASE with solution data (solutionQueries).
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_OFFICIAL_ANSWERS_DATABASE = {
  ...SELECT_DATABASE,
  solutionQueries: {
    include: {
      query: true,
      output: true,
    },
    orderBy: {
      query: { order: 'asc' },
    },
  },
} as const satisfies Prisma.DatabaseSelect

/**
 * Complete database select wrapped in Question structure.
 * Combines base database fields with official answers (solutionQueries).
 *
 * Extracted from SELECT_OFFICIAL_ANSWERS to avoid duplication.
 */
const SELECT_DATABASE_MERGED_QUESTION = {
  database: {
    select: SELECT_OFFICIAL_ANSWERS_DATABASE,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Selects the official answers *inside the database relation only*.
 * Exported for composition in officialAnswers index.
 */
export { SELECT_OFFICIAL_ANSWERS_DATABASE }

/**
 * Complete database select wrapped in Question structure.
 * Exported for use in question copying where full database structure is needed.
 */
export { SELECT_DATABASE_MERGED_QUESTION }
