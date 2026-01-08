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
import {
  SELECT_MULTIPLE_CHOICE,
  SELECT_MULTIPLE_CHOICE_OPTIONS,
} from '../typeSpecific/multipleChoice'

/**
 * Selects the official answers *inside the multipleChoice relation only*.
 * Merges base SELECT_MULTIPLE_CHOICE with solution data (isCorrect in options).
 *
 * Using const literal with `satisfies` preserves literal types for type inference.
 */
const SELECT_OFFICIAL_ANSWERS_MULTIPLE_CHOICE = {
  ...SELECT_MULTIPLE_CHOICE,
  options: {
    ...SELECT_MULTIPLE_CHOICE.options,
    select: {
      ...SELECT_MULTIPLE_CHOICE_OPTIONS,
      isCorrect: true,
    },
  },
} as const satisfies Prisma.MultipleChoiceSelect

/**
 * Complete multipleChoice select wrapped in Question structure.
 * Combines base multipleChoice fields with official answers (isCorrect in options).
 *
 * Extracted from SELECT_OFFICIAL_ANSWERS to avoid duplication.
 */
const SELECT_MULTIPLE_CHOICE_MERGED_QUESTION = {
  multipleChoice: {
    select: SELECT_OFFICIAL_ANSWERS_MULTIPLE_CHOICE,
  },
} as const satisfies Prisma.QuestionSelect

/**
 * Selects the official answers *inside the multipleChoice relation only*.
 * Exported for composition in officialAnswers index.
 */
export { SELECT_OFFICIAL_ANSWERS_MULTIPLE_CHOICE }

/**
 * Complete multipleChoice select wrapped in Question structure.
 * Exported for use in question copying where full multipleChoice structure is needed.
 */
export { SELECT_MULTIPLE_CHOICE_MERGED_QUESTION }
