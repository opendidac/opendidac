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
import { SELECT_STUDENT_ANSWER_MULTIPLE_CHOICE } from './multipleChoice'
import { SELECT_STUDENT_ANSWER_TRUE_FALSE } from './trueFalse'
import { SELECT_STUDENT_ANSWER_ESSAY } from './essay'
import { SELECT_STUDENT_ANSWER_CODE } from './code'
import { SELECT_STUDENT_ANSWER_WEB } from './web'
import { SELECT_STUDENT_ANSWER_DATABASE } from './database'
import { SELECT_STUDENT_ANSWER_EXACT_MATCH } from './exactMatch'
import { SELECT_STUDENT_GRADING } from '../gradings'

/**
 * Selects all student answer types.
 * Returns the complete studentAnswer select including all answer types.
 * 
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_STUDENT_ANSWER = {
  status: true,
  user: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },

  // ---- MultipleChoice student answers ----
  multipleChoice: {
    select: SELECT_STUDENT_ANSWER_MULTIPLE_CHOICE,
  },

  // ---- TrueFalse student answers ----
  trueFalse: {
    select: SELECT_STUDENT_ANSWER_TRUE_FALSE,
  },

  // ---- Essay student answers ----
  essay: {
    select: SELECT_STUDENT_ANSWER_ESSAY,
  },

  // ---- Code student answers ----
  code: {
    select: SELECT_STUDENT_ANSWER_CODE,
  },

  // ---- Web student answers ----
  web: {
    select: SELECT_STUDENT_ANSWER_WEB,
  },

  // ---- Database student answers ----
  database: {
    select: SELECT_STUDENT_ANSWER_DATABASE,
  },

  // ---- ExactMatch student answers ----
  exactMatch: {
    select: SELECT_STUDENT_ANSWER_EXACT_MATCH,
  },
} as const satisfies Prisma.StudentAnswerSelect

/**
 * Selects student answer with grading information.
 * Combines SELECT_STUDENT_ANSWER with studentGrading select.
 * 
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_STUDENT_ANSWER_WITH_GRADING = {
  ...SELECT_STUDENT_ANSWER,
  studentGrading: {
    select: SELECT_STUDENT_GRADING,
  },
} as const satisfies Prisma.StudentAnswerSelect

/**
 * Selects all student answers for the professor grading UI.
 * Includes all answer types: MultipleChoice, TrueFalse, Essay, Code, Web, Database, ExactMatch.
 * 
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_ALL_STUDENT_ANSWERS = {
  studentAnswer: {
    select: SELECT_STUDENT_ANSWER,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Selects all student answers with grading information.
 * Includes all answer types with their gradings: MultipleChoice, TrueFalse, Essay, Code, Web, Database, ExactMatch.
 * 
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING = {
  studentAnswer: {
    select: SELECT_STUDENT_ANSWER_WITH_GRADING,
  },
} as const satisfies Prisma.QuestionSelect


/**
 * Selects student answers for a specific user.
 * Uses a deep-typed literal and injects a dynamic filter.
 */
export const selectStudentAnswersForUser = (
  userEmail: string,
): Prisma.QuestionSelect => ({
  studentAnswer: {
    ...SELECT_ALL_STUDENT_ANSWERS.studentAnswer,
    where: { userEmail },
  },
});

/**
 * Selects student answers with grading for a specific user.
 * Uses a deep-typed literal and injects a dynamic filter.
 */
export const selectStudentAnswersForUserWithGrading = (
  userEmail: string,
): Prisma.QuestionSelect => ({
  studentAnswer: {
    ...SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING.studentAnswer,
    where: { userEmail },
  },
});

/**
 * Selects all student answer types.
 * Exported for composition with other selects (e.g., gradings).
 */
export { SELECT_STUDENT_ANSWER }

/**
 * Selects student answer with grading information.
 * Exported for composition in API endpoints.
 */
export { SELECT_STUDENT_ANSWER_WITH_GRADING }

/**
 * Selects all student answers for the professor grading UI.
 * Exported for use in API endpoints.
 */
export { SELECT_ALL_STUDENT_ANSWERS }

/**
 * Selects all student answers with grading information.
 * Exported for use in API endpoints that need both answers and gradings.
 */
export { SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING }
