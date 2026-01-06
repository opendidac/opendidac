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
  SELECT_CODE,
  SELECT_CODE_WRITING,
  SELECT_CODE_READING,
} from '../typeSpecific/code'

/**
 * Selects the official answers *inside the codeWriting relation only*.
 * Merges base SELECT_CODE_WRITING with solution data (solutionFiles).
 * Includes ALL templateFiles (including HIDDEN) when official answers are merged.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_OFFICIAL_ANSWERS_CODE_WRITING = {
  ...SELECT_CODE_WRITING,
  // Override templateFiles to remove the HIDDEN filter when official answers are included
  templateFiles: {
    select: SELECT_CODE_WRITING.templateFiles.select,
    orderBy: SELECT_CODE_WRITING.templateFiles.orderBy,
  },
  solutionFiles: {
    include: { file: true },
    orderBy: { order: 'asc' },
  },
} as const satisfies Prisma.CodeWritingSelect

/**
 * Selects the official answers *inside the codeReading relation only*.
 * Merges base SELECT_CODE_READING with solution data (context fields, studentOutputTest, snippet output).
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_OFFICIAL_ANSWERS_CODE_READING = {
  ...SELECT_CODE_READING,
  studentOutputTest: true,
  contextExec: true,
  contextPath: true,
  context: true,
  snippets: {
    ...SELECT_CODE_READING.snippets,
    select: {
      ...SELECT_CODE_READING.snippets.select,
      output: true,
    },
  },
} as const satisfies Prisma.CodeReadingSelect

/**
 * Selects the official answers *inside the code relation only*.
 * Only includes codeWriting and codeReading with solution data.
 * Does NOT include base code fields (language, codeType, sandbox).
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_OFFICIAL_ANSWERS_CODE = {
  codeWriting: {
    select: SELECT_OFFICIAL_ANSWERS_CODE_WRITING,
  },
  codeReading: {
    select: SELECT_OFFICIAL_ANSWERS_CODE_READING,
  },
} as const satisfies Prisma.CodeSelect

/**
 * Merged code select combining base code fields with official answers.
 * This includes: language, codeType, sandbox (from base) + codeWriting/codeReading with solutions.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_CODE_MERGED = {
  ...SELECT_CODE,
  ...SELECT_OFFICIAL_ANSWERS_CODE,
} as const satisfies Prisma.CodeSelect

/**
 * Complete code select wrapped in Question structure.
 * Combines base code fields with official answers, ready for use in Question selects.
 *
 * Extracted from SELECT_OFFICIAL_ANSWERS to avoid duplication.
 */
const SELECT_CODE_MERGED_QUESTION = {
  code: {
    select: SELECT_CODE_MERGED,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Runtime function that returns the official answers code select.
 */
export const selectCodeOfficialAnswers = (): Prisma.CodeSelect =>
  SELECT_OFFICIAL_ANSWERS_CODE

/**
 * Selects the official answers *inside the code relation only*.
 * Exported for composition in officialAnswers index.
 */
export { SELECT_OFFICIAL_ANSWERS_CODE }

/**
 * Merged code select combining base code fields with official answers.
 * Exported for composition in officialAnswers index.
 */
export { SELECT_CODE_MERGED }

/**
 * Complete code select wrapped in Question structure.
 * Exported for use in question copying where full code structure is needed.
 */
export { SELECT_CODE_MERGED_QUESTION }
