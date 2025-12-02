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
 * Builds select clause for CodeReadingSnippet relation
 * Note: Official answers (output) are handled by officialAnswers builder
 */
const buildCodeReadingSnippetsSelect = (): Prisma.CodeReadingSnippetSelect => {
  return {
    id: true,
    order: true,
    snippet: true,
  }
}

/**
 * Builds select clause for CodeReading relation
 * Note: Official answers (output, context fields) are handled by officialAnswers builder
 */
const buildCodeReadingSelect = (): Prisma.CodeReadingSelect => {
  return {
    snippets: {
      select: buildCodeReadingSnippetsSelect(),
      orderBy: { order: 'asc' },
    },
  }
}

/**
 * Builds select clause for CodeWriting relation
 * Note: Official answers (solutionFiles) are handled by officialAnswers builder
 * TemplateFiles filtering: Always filters HIDDEN files for security (students shouldn't see hidden files)
 */
const buildCodeWritingSelect = (): Prisma.CodeWritingSelect => {
  return {
    codeCheckEnabled: true,
    templateFiles: {
      where: {
        studentPermission: { not: StudentPermission.HIDDEN },
      },
      include: { file: true },
      orderBy: { order: 'asc' },
    },
    testCases: { orderBy: { index: 'asc' } },
  }
}

/**
 * Builds select clause for Code relation
 * Note: Official answers (solutionFiles, output, context fields) are handled by officialAnswers builder
 */
const buildCodeSelect = (): Prisma.CodeSelect => {
  return {
    language: true,
    sandbox: true,
    codeType: true,
    codeWriting: {
      select: buildCodeWritingSelect(),
    },
    codeReading: {
      select: buildCodeReadingSelect(),
    },
  }
}

/**
 * Builds code type-specific select clause for Question
 * Note: Official answers (solutionFiles, output, context fields) are handled by officialAnswers builder
 */
export const buildCode = (): Prisma.QuestionSelect => {
  return {
    code: {
      select: buildCodeSelect(),
    },
  }
}
