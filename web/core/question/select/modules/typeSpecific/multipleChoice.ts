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
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_MULTIPLE_CHOICE_OPTIONS = {
  id: true,
  order: true,
  text: true,
} as const satisfies OptionSelectWithoutCorrect

/**
 * Selects MultipleChoice relation
 * SAFE: no isCorrect here (handled by officialAnswers select)
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_MULTIPLE_CHOICE = {
  gradingPolicy: true, // allowed (not sensitive)
  activateStudentComment: true,
  studentCommentLabel: true,
  activateSelectionLimit: true,
  selectionLimit: true,
  options: {
    select: SELECT_MULTIPLE_CHOICE_OPTIONS,
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  },
} as const satisfies Prisma.MultipleChoiceSelect

/**
 * Selects multiple choice type-specific relation for Question
 * SAFE: no solution data
 *
 * Using const literal with `satisfies` preserves literal types for type inference,
 * allowing reuse for selects, type safety, and payload validation.
 */
const SELECT_MULTIPLE_CHOICE_QUESTION = {
  multipleChoice: {
    select: SELECT_MULTIPLE_CHOICE,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Runtime function that returns the multiple choice select.
 * For backward compatibility and runtime use.
 */
export const selectMultipleChoice = (): Prisma.QuestionSelect =>
  SELECT_MULTIPLE_CHOICE_QUESTION

/**
 * Selects MultipleChoice options relation.
 * Exported for composition in official answers selects.
 */
export { SELECT_MULTIPLE_CHOICE_OPTIONS }

/**
 * Selects MultipleChoice relation.
 * Exported for composition in official answers selects.
 */
export { SELECT_MULTIPLE_CHOICE }

/**
 * Selects multiple choice type-specific relation for Question.
 * Exported for composition in type-specific index.
 */
export { SELECT_MULTIPLE_CHOICE_QUESTION }
