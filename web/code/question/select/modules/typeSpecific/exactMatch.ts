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

/**
 * Selects ExactMatchField relation
 * Note: Official answers (matchRegex) are handled by officialAnswers select
 */
const selectExactMatchFieldsSelect = (): Prisma.ExactMatchFieldSelect => {
  return {
    id: true,
    order: true,
    statement: true,
  }
}

/**
 * Selects ExactMatch relation
 * Note: Official answers (matchRegex) are handled by officialAnswers select
 */
const selectExactMatchSelect = (): Prisma.ExactMatchSelect => {
  return {
    questionId: true,
    fields: {
      select: selectExactMatchFieldsSelect(),
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    },
  }
}

/**
 * Selects exact match type-specific relation for Question
 * Note: Official answers (matchRegex) are handled by officialAnswers select
 */
export const selectExactMatch = (): Prisma.QuestionSelect => {
  return {
    exactMatch: {
      select: selectExactMatchSelect(),
    },
  }
}
