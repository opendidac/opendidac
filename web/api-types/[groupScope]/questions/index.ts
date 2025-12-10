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

import type { Prisma } from '@prisma/client'

import {
  SELECT_BASE_WITH_PROFESSOR_INFO,
  SELECT_TYPE_SPECIFIC,
  SELECT_QUESTION_TAGS,
} from '@/core/question/select'

/**
 * SELECT for GET /questions (listing)
 */
export const SELECT_FOR_PROFESSOR_LISTING = {
  lastUsed: true,
  usageStatus: true,
  evaluation: true,
  ...SELECT_BASE_WITH_PROFESSOR_INFO,
  ...SELECT_TYPE_SPECIFIC,
  ...SELECT_QUESTION_TAGS,
} as const satisfies Prisma.QuestionSelect

export type ProfessorListingPayload = Prisma.QuestionGetPayload<{
  select: typeof SELECT_FOR_PROFESSOR_LISTING
}>
