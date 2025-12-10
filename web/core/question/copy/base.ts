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

import { Prisma, QuestionSource, QuestionUsageStatus } from '@prisma/client'
import { SELECT_BASE_WITH_PROFESSOR_INFO } from '@/core/question/select/modules/base'
import { SELECT_TYPE_SPECIFIC } from '@/core/question/select/modules/typeSpecific'
import { SELECT_OFFICIAL_ANSWERS } from '@/core/question/select/modules/officialAnswers'
import { SELECT_QUESTION_TAGS } from '@/core/question/select/modules/tags'

/**
 * Selects all fields needed for question copying.
 * Merges base fields (with professor info), type-specific relations, official answers, and tags.
 *
 * Since each module has different keys, object spread preserves literal types perfectly
 * without needing mergeSelects.
 *
 * We use `satisfies Prisma.QuestionSelect` instead of a return type "Prisma.QuestionSelect"
 * A return type annotation would *widen* the object and erase its nested
 * structure, breaking deep inference. `satisfies` keeps the exact literal
 * shape while still enforcing Prisma.QuestionSelect constraints.
 *
 * IMPORTANT: We export both a const object and a function:
 * - `SELECT_FOR_QUESTION_COPY` (const): Preserves literal types for TypeScript inference
 * - `selectForQuestionCopy()` (function): For runtime use when you need a fresh object
 *
 * Use the const directly when you need type inference (e.g., in type definitions).
 * Use the function when you need a runtime value (e.g., in Prisma queries).
 */
export const SELECT_FOR_QUESTION_COPY = {
  ...SELECT_BASE_WITH_PROFESSOR_INFO,
  ...SELECT_TYPE_SPECIFIC,
  ...SELECT_OFFICIAL_ANSWERS,
  ...SELECT_QUESTION_TAGS,
} as const satisfies Prisma.QuestionSelect

/**
 * Payload type produced by selectForQuestionCopy().
 * Uses the const directly to preserve deep literal types.
 */
export type QuestionCopyPayload = Prisma.QuestionGetPayload<{
  select: typeof SELECT_FOR_QUESTION_COPY
}>

export type BaseQuestionCreateData = Omit<
  Prisma.QuestionCreateInput,
  | 'multipleChoice'
  | 'trueFalse'
  | 'essay'
  | 'code'
  | 'web'
  | 'database'
  | 'exactMatch'
>

/**
 * Base data used for all copied questions.
 * Uses ONLY a simple prefix for title decoration.
 */
export const buildBaseData = (
  question: QuestionCopyPayload,
  source: QuestionSource,
  prefix?: string,
): BaseQuestionCreateData => ({
  title: prefix ? `${prefix}${question.title}` : question.title,
  content: question.content,
  type: question.type,
  scratchpad: question.scratchpad,

  usageStatus:
    source === QuestionSource.EVAL
      ? QuestionUsageStatus.NOT_APPLICABLE
      : QuestionUsageStatus.UNUSED,

  source,
  sourceQuestion: { connect: { id: question.id } },

  group: { connect: { id: question.groupId } },

  questionToTag: {
    create: question.questionToTag.map((qt) => ({
      tag: {
        connect: {
          groupId_label: {
            groupId: question.groupId,
            label: qt.label,
          },
        },
      },
    })),
  },
})
