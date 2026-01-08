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
 * Internal helper for grading selection inside StudentAnswer.
 * Exported for reuse in progress tracking and other modules.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
export const SELECT_STUDENT_GRADING = {
  status: true,
  pointsObtained: true,
  comment: true,
  signedBy: {
    select: {
      email: true,
      name: true,
      image: true,
    },
  },
  questionId: true, // for grading frontend to know which question is being graded
  userEmail: true, // for grading frontend to know which user is being graded
} as const satisfies Prisma.StudentQuestionGradingSelect

/**
 * Runtime function that returns the student grading select.
 * For backward compatibility and runtime use.
 */
export const selectStudentGradingSelect =
  (): Prisma.StudentQuestionGradingSelect => SELECT_STUDENT_GRADING

/**
 * Runtime function that returns the student gradings select.
 * For backward compatibility and runtime use.
 */
export const selectStudentGradings = (): Prisma.QuestionSelect =>
  SELECT_STUDENT_GRADINGS

/**
 * Selects grading information for professor grading view.
 * Returns the grading info on each studentAnswer.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
export const SELECT_STUDENT_GRADINGS = {
  studentAnswer: {
    select: {
      studentGrading: {
        select: SELECT_STUDENT_GRADING,
      },
    },
  },
} as const satisfies Prisma.QuestionSelect
