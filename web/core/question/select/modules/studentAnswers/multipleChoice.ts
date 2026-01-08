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

type OptionSelectWithoutCorrect = Omit<Prisma.OptionSelect, 'isCorrect'>

/**
 * Selects MultipleChoice options relation for student answers.
 * Also used by professors for consulting and grading.
 *
 * IMPORTANT: Student answers do NOT duplicate options. Instead, students connect to
 * the question's original options (via relation) to indicate which ones they selected.
 * The `isCorrect` field belongs to the question's options, not the student answer.
 *
 * SAFE: We exclude `isCorrect` here since this select is used for both professors
 * (who need to see correct answers) and students (who should not see correct answers).
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_MULTIPLE_CHOICE_OPTIONS_STUDENT = {
  id: true,
  order: true,
  text: true,
} as const satisfies OptionSelectWithoutCorrect

/**
 * Selects MultipleChoice student answers.
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_STUDENT_ANSWER_MULTIPLE_CHOICE = {
  comment: true,
  options: {
    select: SELECT_MULTIPLE_CHOICE_OPTIONS_STUDENT,
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  },
} as const satisfies Prisma.StudentAnswerMultipleChoiceSelect

/**
 * Selects MultipleChoice student answers.
 * Exported for composition in student answers index.
 */
export { SELECT_STUDENT_ANSWER_MULTIPLE_CHOICE }
