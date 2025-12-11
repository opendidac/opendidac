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
 * Runtime function that returns the question tags select.
 * For backward compatibility and runtime use.
 */
export const selectQuestionTags = (): Prisma.QuestionSelect =>
  SELECT_QUESTION_TAGS

/**
 * Selects tag relation.
 *
 * Using const literal with `satisfies` preserves literal types for type inference,
 * allowing reuse for selects, type safety, and payload validation.
 */
export const SELECT_QUESTION_TAGS = {
  questionToTag: {
    select: {
      questionId: true,
      groupId: true,
      label: true,
      tag: {
        select: {
          label: true,
          groupId: true,
        },
      },
    },
  },
} as const satisfies Prisma.QuestionSelect
