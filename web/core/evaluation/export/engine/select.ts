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

import {
  SELECT_BASE,
  SELECT_BASE_WITH_PROFESSOR_INFO,
  SELECT_TYPE_SPECIFIC,
  SELECT_QUESTION_TAGS,
  SELECT_OFFICIAL_ANSWERS,
  SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING,
  SELECT_STUDENT_ANSWER_WITH_GRADING,
} from '@/core/question/select'
import { Prisma } from '@prisma/client'

/**
 * Select for student export.
 * @param email - The student's email.
 * @returns The select for student export.
 */
export const selectForStudentExport = (
  email: string,
): Prisma.QuestionSelect => {
  return {
    ...SELECT_BASE,
    ...SELECT_TYPE_SPECIFIC,
    ...SELECT_QUESTION_TAGS,
    studentAnswer: {
      select: SELECT_STUDENT_ANSWER_WITH_GRADING,
      where: { userEmail: email },
    },
  } as const satisfies Prisma.QuestionSelect
}

export const selectForProfessorExport = (
  includeSubs: boolean,
): Prisma.QuestionSelect => {
  const base: Prisma.QuestionSelect = {
    ...SELECT_BASE_WITH_PROFESSOR_INFO,
    ...SELECT_TYPE_SPECIFIC,
    ...SELECT_OFFICIAL_ANSWERS,
    ...SELECT_QUESTION_TAGS,
  } as const satisfies Prisma.QuestionSelect

  return includeSubs
    ? ({
        ...base,
        ...SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING,
      } as const satisfies Prisma.QuestionSelect)
    : base
}
