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
 * Builds select clause for ExactMatchField relation
 * Note: Official answers (matchRegex) are handled by officialAnswers builder
 */
const buildExactMatchFieldsSelect = (): Prisma.ExactMatchFieldSelect => {
  return {
    id: true,
    order: true,
    statement: true,
  }
}

/**
 * Builds select clause for ExactMatch relation
 * Note: Official answers (matchRegex) are handled by officialAnswers builder
 */
const buildExactMatchSelect = (): Prisma.ExactMatchSelect => {
  return {
    questionId: true,
    fields: {
      select: buildExactMatchFieldsSelect(),
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    },
  }
}

/**
 * Builds exact match type-specific select clause for Question
 * Note: Official answers (matchRegex) are handled by officialAnswers builder
 */
export const buildExactMatch = (): Prisma.QuestionSelect => {
  return {
    exactMatch: {
      select: buildExactMatchSelect(),
    },
  }
}
