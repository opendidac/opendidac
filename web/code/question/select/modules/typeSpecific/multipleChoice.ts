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
 * Sensitive MCQ data: isCorrect
 * We remove it from OptionSelect to prevent accidental leakage.
 * Student should not fetch that field in this context
 */
type OptionSelectWithoutCorrect = Omit<Prisma.OptionSelect, 'isCorrect'>

/**
 * Selects MultipleChoice options relation
 * SAFE: Cannot include isCorrect
 */
const selectMultipleChoiceOptionsSelect = (): OptionSelectWithoutCorrect => {
  return {
    id: true,
    order: true,
    text: true,
  }
}

/**
 * Selects MultipleChoice relation
 * SAFE: no isCorrect here (handled by officialAnswers select)
 */
const selectMultipleChoiceTypeSpecific = (): Prisma.MultipleChoiceSelect => {
  return {
    gradingPolicy: true, // allowed (not sensitive)
    activateStudentComment: true,
    studentCommentLabel: true,
    activateSelectionLimit: true,
    selectionLimit: true,
    options: {
      select: selectMultipleChoiceOptionsSelect(),
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    },
  }
}

/**
 * Selects multiple choice type-specific relation for Question
 * SAFE: no solution data
 */
export const selectMultipleChoice = (): Prisma.QuestionSelect => {
  return {
    multipleChoice: {
      select: selectMultipleChoiceTypeSpecific(),
    },
  }
}
