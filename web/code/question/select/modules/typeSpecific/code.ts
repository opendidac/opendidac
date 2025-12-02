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
 * Selects CodeReadingSnippet relation
 * Note: Official answers (output) are handled by officialAnswers select
 */
const selectCodeReadingSnippetsSelect = (): Prisma.CodeReadingSnippetSelect => {
  return {
    id: true,
    order: true,
    snippet: true,
  }
}

/**
 * Selects CodeReading relation
 * Note: Official answers (output, context fields) are handled by officialAnswers select
 */
const selectCodeReadingSelect = (): Prisma.CodeReadingSelect => {
  return {
    snippets: {
      select: selectCodeReadingSnippetsSelect(),
      orderBy: { order: 'asc' },
    },
  }
}

/**
 * Selects CodeWriting relation
 * Note: Official answers (solutionFiles) are handled by officialAnswers select
 * TemplateFiles filtering: Always filters HIDDEN files for security (students shouldn't see hidden files)
 */
const selectCodeWritingSelect = (): Prisma.CodeWritingSelect => {
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
 * Selects Code relation
 * Note: Official answers (solutionFiles, output, context fields) are handled by officialAnswers select
 */
const selectCodeSelect = (): Prisma.CodeSelect => {
  return {
    language: true,
    sandbox: true,
    codeType: true,
    codeWriting: {
      select: selectCodeWritingSelect(),
    },
    codeReading: {
      select: selectCodeReadingSelect(),
    },
  }
}

/**
 * Selects code type-specific relation for Question
 * Note: Official answers (solutionFiles, output, context fields) are handled by officialAnswers select
 */
export const selectCode = (): Prisma.QuestionSelect => {
  return {
    code: {
      select: selectCodeSelect(),
    },
  }
}
