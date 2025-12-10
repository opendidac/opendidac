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
import { SELECT_OFFICIAL_ANSWERS_MULTIPLE_CHOICE } from './multipleChoice'
import { SELECT_OFFICIAL_ANSWERS_TRUE_FALSE } from './trueFalse'
import { SELECT_OFFICIAL_ANSWERS_ESSAY } from './essay'
import { SELECT_OFFICIAL_ANSWERS_WEB } from './web'
import { SELECT_OFFICIAL_ANSWERS_EXACT_MATCH } from './exactMatch'
import { SELECT_CODE_MERGED } from './code'
import { SELECT_OFFICIAL_ANSWERS_DATABASE } from './database'

/**
 * Selects official answers for all question types at the Question level.
 *
 * Note: For code questions, we use SELECT_CODE_MERGED which includes base fields
 * (codeType, language, sandbox) in addition to solution data, as the frontend
 * needs codeType to determine which component to render (codeWriting vs codeReading).
 *
 * Using const literal with `satisfies` preserves literal types for type inference,
 * allowing reuse for selects, type safety, and payload validation.
 */
const SELECT_OFFICIAL_ANSWERS = {
  multipleChoice: {
    select: SELECT_OFFICIAL_ANSWERS_MULTIPLE_CHOICE,
  },
  trueFalse: {
    select: SELECT_OFFICIAL_ANSWERS_TRUE_FALSE,
  },
  essay: {
    select: SELECT_OFFICIAL_ANSWERS_ESSAY,
  },
  web: {
    select: SELECT_OFFICIAL_ANSWERS_WEB,
  },
  exactMatch: {
    select: SELECT_OFFICIAL_ANSWERS_EXACT_MATCH,
  },
  code: {
    select: SELECT_CODE_MERGED,
  },
  database: {
    select: SELECT_OFFICIAL_ANSWERS_DATABASE,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Runtime function that returns the official answers select.
 * For backward compatibility and runtime use.
 */
export const selectOfficialAnswers = (): Prisma.QuestionSelect =>
  SELECT_OFFICIAL_ANSWERS

/**
 * Complete code select wrapped in Question structure.
 * Combines base code fields with official answers, ready for use in Question selects.
 *
 * Extracted from SELECT_OFFICIAL_ANSWERS to avoid duplication.
 */
const SELECT_CODE_MERGED_QUESTION = {
  code: SELECT_OFFICIAL_ANSWERS.code,
} as const satisfies Prisma.QuestionSelect

/**
 * Complete multipleChoice select wrapped in Question structure.
 * Combines base multipleChoice fields with official answers (isCorrect in options).
 *
 * Extracted from SELECT_OFFICIAL_ANSWERS to avoid duplication.
 */
const SELECT_MULTIPLE_CHOICE_MERGED_QUESTION = {
  multipleChoice: SELECT_OFFICIAL_ANSWERS.multipleChoice,
} as const satisfies Prisma.QuestionSelect

/**
 * Complete trueFalse select wrapped in Question structure.
 * Combines base trueFalse fields with official answers (isTrue).
 *
 * Extracted from SELECT_OFFICIAL_ANSWERS to avoid duplication.
 */
const SELECT_TRUE_FALSE_MERGED_QUESTION = {
  trueFalse: SELECT_OFFICIAL_ANSWERS.trueFalse,
} as const satisfies Prisma.QuestionSelect

/**
 * Complete essay select wrapped in Question structure.
 * Combines base essay fields with official answers (solution).
 *
 * Extracted from SELECT_OFFICIAL_ANSWERS to avoid duplication.
 */
const SELECT_ESSAY_MERGED_QUESTION = {
  essay: SELECT_OFFICIAL_ANSWERS.essay,
} as const satisfies Prisma.QuestionSelect

/**
 * Complete web select wrapped in Question structure.
 * Combines base web fields with official answers (solutionHtml, solutionCss, solutionJs).
 *
 * Extracted from SELECT_OFFICIAL_ANSWERS to avoid duplication.
 */
const SELECT_WEB_MERGED_QUESTION = {
  web: SELECT_OFFICIAL_ANSWERS.web,
} as const satisfies Prisma.QuestionSelect

/**
 * Complete exactMatch select wrapped in Question structure.
 * Combines base exactMatch fields with official answers (matchRegex in fields).
 *
 * Extracted from SELECT_OFFICIAL_ANSWERS to avoid duplication.
 */
const SELECT_EXACT_MATCH_MERGED_QUESTION = {
  exactMatch: SELECT_OFFICIAL_ANSWERS.exactMatch,
} as const satisfies Prisma.QuestionSelect

/**
 * Complete database select wrapped in Question structure.
 * Combines base database fields with official answers (solutionQueries).
 *
 * Extracted from SELECT_OFFICIAL_ANSWERS to avoid duplication.
 */
const SELECT_DATABASE_MERGED_QUESTION = {
  database: SELECT_OFFICIAL_ANSWERS.database,
} as const satisfies Prisma.QuestionSelect

/**
 * Selects official answers for all question types at the Question level.
 * Exported for use in API endpoints and question copying.
 */
export { SELECT_OFFICIAL_ANSWERS }

/**
 * Complete code select wrapped in Question structure.
 * Exported for use in question copying where full code structure is needed.
 */
export { SELECT_CODE_MERGED_QUESTION }

/**
 * Complete multipleChoice select wrapped in Question structure.
 * Exported for use in question copying where full multipleChoice structure is needed.
 */
export { SELECT_MULTIPLE_CHOICE_MERGED_QUESTION }

/**
 * Complete trueFalse select wrapped in Question structure.
 * Exported for use in question copying where full trueFalse structure is needed.
 */
export { SELECT_TRUE_FALSE_MERGED_QUESTION }

/**
 * Complete essay select wrapped in Question structure.
 * Exported for use in question copying where full essay structure is needed.
 */
export { SELECT_ESSAY_MERGED_QUESTION }

/**
 * Complete web select wrapped in Question structure.
 * Exported for use in question copying where full web structure is needed.
 */
export { SELECT_WEB_MERGED_QUESTION }

/**
 * Complete exactMatch select wrapped in Question structure.
 * Exported for use in question copying where full exactMatch structure is needed.
 */
export { SELECT_EXACT_MATCH_MERGED_QUESTION }

/**
 * Complete database select wrapped in Question structure.
 * Exported for use in question copying where full database structure is needed.
 */
export { SELECT_DATABASE_MERGED_QUESTION }

// Re-export from code.ts for backward compatibility
export { selectCodeOfficialAnswers } from './code'
