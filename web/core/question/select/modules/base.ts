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
 * Selects base scalar fields for the question select clause.
 * Base version without professor-only info (title, scratchpad).
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
export const SELECT_BASE = {
  id: true,
  type: true,
  status: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  groupId: true,
} as const satisfies Prisma.QuestionSelect

/**
 * Runtime function that returns the base select.
 * For backward compatibility and runtime use.
 */
export const selectBase = ({
  includeProfessorOnlyInfo,
}: {
  includeProfessorOnlyInfo?: boolean
}): Prisma.QuestionSelect => {
  return includeProfessorOnlyInfo
    ? SELECT_BASE_WITH_PROFESSOR_INFO
    : SELECT_BASE
}

/**
 * Selects base scalar fields including professor-only info (title, scratchpad).
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
export const SELECT_BASE_WITH_PROFESSOR_INFO = {
  ...SELECT_BASE,
  title: true,
  scratchpad: true,
} as const satisfies Prisma.QuestionSelect
