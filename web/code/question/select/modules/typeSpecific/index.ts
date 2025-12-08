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
import { SELECT_MULTIPLE_CHOICE_QUESTION } from './multipleChoice'
import { SELECT_TRUE_FALSE_QUESTION } from './trueFalse'
import { SELECT_ESSAY_QUESTION } from './essay'
import { SELECT_WEB_QUESTION } from './web'
import { SELECT_EXACT_MATCH_QUESTION } from './exactMatch'
import { SELECT_CODE_QUESTION } from './code'
import { SELECT_DATABASE_QUESTION } from './database'

/**
 * Selects all type-specific relations.
 * Merges all question type selects together using object spread.
 *
 * Since each question type has a different key (multipleChoice, trueFalse, etc.),
 * object spread preserves literal types perfectly without needing mergeSelects.
 *
 * Using const literal with `satisfies` preserves literal types for type inference,
 * allowing reuse for selects, type safety, and payload validation.
 */
const SELECT_TYPE_SPECIFIC = {
  ...SELECT_MULTIPLE_CHOICE_QUESTION,
  ...SELECT_TRUE_FALSE_QUESTION,
  ...SELECT_ESSAY_QUESTION,
  ...SELECT_WEB_QUESTION,
  ...SELECT_EXACT_MATCH_QUESTION,
  ...SELECT_CODE_QUESTION,
  ...SELECT_DATABASE_QUESTION,
} as const satisfies Prisma.QuestionSelect

/**
 * Runtime function that returns the type-specific select.
 * For backward compatibility and runtime use.
 */
export const selectTypeSpecific = (): Prisma.QuestionSelect =>
  SELECT_TYPE_SPECIFIC

/**
 * Selects all type-specific relations.
 * Exported for use in API endpoints and question copying.
 */
export { SELECT_TYPE_SPECIFIC }
