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

import { Prisma, StudentPermission } from '@prisma/client'

/**
 * Selects CodeReading relation
 * Note: Official answers (output, context fields) are handled by officialAnswers select
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_CODE_READING = {
  snippets: {
    select: {
      id: true,
      order: true,
      snippet: true,
      // no output — added only by official answers
    },
    orderBy: { order: 'asc' },
  },
} as const satisfies Prisma.CodeReadingSelect

/**
 * Selects CodeWriting relation
 * Note: Official answers (solutionFiles) are handled by officialAnswers select
 * TemplateFiles filtering: Always filters HIDDEN files for security (students shouldn't see hidden files)
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_CODE_WRITING = {
  codeCheckEnabled: true,

  templateFiles: {
    where: {
      studentPermission: { not: StudentPermission.HIDDEN },
    },
    select: {
      order: true,
      studentPermission: true,
      file: {
        select: {
          path: true,
          content: true,
          createdAt: true,
        },
      },
    },
    orderBy: { order: 'asc' },
  },

  testCases: {
    select: {
      index: true,
      exec: true,
      input: true,
      expectedOutput: true,
    },
    orderBy: { index: 'asc' },
  },

  // solutionFiles excluded (official answers only)
} as const satisfies Prisma.CodeWritingSelect

/**
 * Selects CodeWriting relation WITH ALL templateFiles (including HIDDEN).
 * Used for export/copy operations where we need to preserve all files.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_CODE_WRITING_WITH_ALL_FILES = {
  codeCheckEnabled: true,

  templateFiles: {
    select: {
      order: true,
      studentPermission: true,
      file: {
        select: {
          path: true,
          content: true,
          createdAt: true,
        },
      },
    },
    orderBy: { order: 'asc' },
  },

  testCases: {
    select: {
      index: true,
      exec: true,
      input: true,
      expectedOutput: true,
    },
    orderBy: { index: 'asc' },
  },

  // solutionFiles excluded (official answers only)
} as const satisfies Prisma.CodeWritingSelect

/**
 * Selects Code relation
 * Note: Official answers (solutionFiles, output, context fields) are handled by officialAnswers select
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_CODE = {
  language: true,
  codeType: true,

  sandbox: {
    select: {
      image: true,
      beforeAll: true,
    },
  },

  codeWriting: {
    select: SELECT_CODE_WRITING,
  },

  codeReading: {
    select: SELECT_CODE_READING,
  },
} as const satisfies Prisma.CodeSelect

/**
 * Selects Code relation WITH ALL templateFiles (including HIDDEN).
 * Used for export/copy operations where we need to preserve all files.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_CODE_WITH_ALL_FILES = {
  language: true,
  codeType: true,

  sandbox: {
    select: {
      image: true,
      beforeAll: true,
    },
  },

  codeWriting: {
    select: SELECT_CODE_WRITING_WITH_ALL_FILES,
  },

  codeReading: {
    select: SELECT_CODE_READING,
  },
} as const satisfies Prisma.CodeSelect

/**
 * Selects code type-specific relation for Question
 * Note: Official answers (solutionFiles, output, context fields) are handled by officialAnswers select
 *
 * Using const literal with `satisfies` preserves literal types for type inference,
 * allowing reuse for selects, type safety, and payload validation.
 */
const SELECT_CODE_QUESTION = {
  code: {
    select: SELECT_CODE,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Selects code type-specific relation for Question WITH ALL templateFiles (including HIDDEN).
 * Used for export/copy operations where we need to preserve all files.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_CODE_QUESTION_WITH_ALL_FILES = {
  code: {
    select: SELECT_CODE_WITH_ALL_FILES,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Selects CodeReading relation.
 * Exported for composition in official answers selects.
 */
export { SELECT_CODE_READING }

/**
 * Selects CodeWriting relation.
 * Exported for composition in official answers selects.
 */
export { SELECT_CODE_WRITING }

/**
 * Selects Code relation.
 * Exported for composition in official answers selects.
 */
export { SELECT_CODE }

/**
 * Selects code type-specific relation for Question.
 * Exported for composition in type-specific index.
 */
export { SELECT_CODE_QUESTION }

/**
 * Selects code type-specific relation for Question WITH ALL templateFiles (including HIDDEN).
 * Exported for export/copy operations.
 */
export { SELECT_CODE_QUESTION_WITH_ALL_FILES }
