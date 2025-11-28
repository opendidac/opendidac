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
 * Builds select clause for MultipleChoice options relation
 */
const buildMultipleChoiceOptionsSelect = (): Prisma.OptionSelect => {
  return {
    id: true,
    order: true,
    text: true,
    isCorrect: true,
  }
}

/**
 * Internal helper for MultipleChoice student answers.
 * Not exported. Not reusable outside this module (for now).
 */
const buildStudentAnswerMultipleChoice =
  (): Prisma.StudentAnswerMultipleChoiceSelect => {
    return {
      comment: true,
      options: {
        select: buildMultipleChoiceOptionsSelect(),
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
      },
    }
  }

/**
 * Temporary student answers builder for the professor grading UI.
 * Only includes MultipleChoice for now.
 *
 * Later this will be split per question type and reused by the grading module.
 */
export const buildAllStudentAnswers = (): Prisma.QuestionSelect => {
  return {
    studentAnswer: {
      select: {
        status: true,
        user: true,

        // ---- MultipleChoice student answers ----
        multipleChoice: {
          select: buildStudentAnswerMultipleChoice(),
        },

        // TODO:
        // essay
        // trueFalse
        // code
        // exactMatch
        // web
        // database
      },
    },
  }
}
