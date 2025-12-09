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

/* -------------------------------------------------------------------------- */
/*                             PURE SELECT LITERALS                            */
/* -------------------------------------------------------------------------- */

/**
 * Selects all student answer types.
 * Pure literal → perfect deep inference.
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

  multipleChoice: {
    select: SELECT_STUDENT_ANSWER_MULTIPLE_CHOICE,
  },

  trueFalse: {
    select: SELECT_STUDENT_ANSWER_TRUE_FALSE,
  },

  essay: {
    select: SELECT_STUDENT_ANSWER_ESSAY,
  },

  code: {
    select: SELECT_STUDENT_ANSWER_CODE,
  },

  web: {
    select: SELECT_STUDENT_ANSWER_WEB,
  },

  database: {
    select: SELECT_STUDENT_ANSWER_DATABASE,
  },

  exactMatch: {
    select: SELECT_STUDENT_ANSWER_EXACT_MATCH,
  },
} as const satisfies Prisma.StudentAnswerSelect

/**
 * Same as above + grading information.
 */
const SELECT_STUDENT_ANSWER_WITH_GRADING = {
  ...SELECT_STUDENT_ANSWER,
  studentGrading: {
    select: SELECT_STUDENT_GRADING,
  },
} as const satisfies Prisma.StudentAnswerSelect

/**
 * Selects ALL student answers for a question.
 */
export const SELECT_ALL_STUDENT_ANSWERS = {
  studentAnswer: {
    select: SELECT_STUDENT_ANSWER,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Same but includes grading information.
 */
export const SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING = {
  studentAnswer: {
    select: SELECT_STUDENT_ANSWER_WITH_GRADING,
  },
} as const satisfies Prisma.QuestionSelect

export {
  SELECT_STUDENT_ANSWER,
  SELECT_STUDENT_ANSWER_WITH_GRADING,
}
