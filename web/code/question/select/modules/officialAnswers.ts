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
 * Official MCQ-sensitive data: isCorrect
 * Only used inside professor/editor contexts.
 */
type OptionSelectCorrectOnly = Pick<Prisma.OptionSelect, 'isCorrect'>

/**
 * Helper to expose sensitive option fields.
 */
const buildMultipleChoiceOptionsSelect = (): OptionSelectCorrectOnly => {
  return {
    isCorrect: true,
  }
}

/**
 * Builds the official answers *inside the multipleChoice relation only*.
 * This returns a valid Prisma.MultipleChoiceSelect.
 */
export const buildOfficialAnswersMultipleChoice =
  (): Prisma.MultipleChoiceSelect => {
    return {
      options: {
        select: buildMultipleChoiceOptionsSelect(),
      },
    }
  }

/**
 * Builds official answers for MultipleChoice at the Question level.
 * This returns a valid Prisma.QuestionSelect.
 */
export const buildOfficialAnswers = (): Prisma.QuestionSelect => {
  return {
    multipleChoice: {
      select: buildOfficialAnswersMultipleChoice(),
    },
  }
}
