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
 * Selects CodeWriting file for student answers.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_CODE_WRITING_FILE_STUDENT = {
  studentPermission: true,
  order: true,
  file: {
    select: {
      id: true,
      updatedAt: true,
      path: true,
      content: true,
      annotation: true,
    },
  },
} as const satisfies Prisma.StudentAnswerCodeToFileSelect

/**
 * Selects CodeWriting student answers.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_STUDENT_ANSWER_CODE_WRITING = {
  files: {
    where: {
      studentPermission: {
        not: StudentPermission.HIDDEN,
      },
    },
    select: SELECT_CODE_WRITING_FILE_STUDENT,
    orderBy: { order: 'asc' },
  },
  testCaseResults: true,
  allTestCasesPassed: true,
} as const satisfies Prisma.StudentAnswerCodeWritingSelect

/**
 * Selects CodeReading snippet for student answers.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_CODE_READING_SNIPPET_STUDENT = {
  id: true,
  snippet: true,
  order: true,
} as const satisfies Prisma.CodeReadingSnippetSelect

/**
 * Selects CodeReading output for student answers.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_CODE_READING_OUTPUT_STUDENT = {
  output: true,
  status: true,
  codeReadingSnippet: {
    select: SELECT_CODE_READING_SNIPPET_STUDENT,
  },
} as const satisfies Prisma.StudentAnswerCodeReadingOutputSelect

/**
 * Selects CodeReading student answers.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_STUDENT_ANSWER_CODE_READING = {
  outputs: {
    select: SELECT_CODE_READING_OUTPUT_STUDENT,
    orderBy: {
      codeReadingSnippet: {
        order: 'asc',
      },
    },
  },
} as const satisfies Prisma.StudentAnswerCodeReadingSelect

/**
 * Selects Code student answers (combines codeWriting and codeReading).
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_STUDENT_ANSWER_CODE = {
  codeType: true,
  codeWriting: {
    select: SELECT_STUDENT_ANSWER_CODE_WRITING,
  },
  codeReading: {
    select: SELECT_STUDENT_ANSWER_CODE_READING,
  },
} as const satisfies Prisma.StudentAnswerCodeSelect

/**
 * Selects Code student answers.
 * Exported for composition in student answers index.
 */
export { SELECT_STUDENT_ANSWER_CODE }
