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

import { StudentPermission } from '@prisma/client'
import type { PartialPrismaSelect } from '../../utils/types'

/**
 * Builds code type-specific select clause
 * Note: Official answers (solutionFiles, output, etc.) are handled by officialAnswers builder
 * TemplateFiles filtering is conditional: when officialAnswers are NOT included, filter HIDDEN files
 * Calling this function means we want type-specific data included
 * @param includeOfficialAnswers - Pass true if official answers will also be included (affects templateFiles filtering)
 */
export const buildCode = ({
  includeOfficialAnswers,
}: {
  includeOfficialAnswers?: boolean
} = {}): PartialPrismaSelect => {
  return {
    code: {
      select: {
        language: true,
        sandbox: true,
        codeType: true,
        codeWriting: {
          select: {
            codeCheckEnabled: true,
            templateFiles: {
              ...(!includeOfficialAnswers
                ? {
                    where: {
                      studentPermission: { not: StudentPermission.HIDDEN },
                    },
                  }
                : {}),
              include: { file: true },
              orderBy: { order: 'asc' },
            },
            testCases: { orderBy: { index: 'asc' } },
          },
        },
        codeReading: {
          select: {
            snippets: {
              select: {
                id: true,
                order: true,
                snippet: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    },
  }
}
