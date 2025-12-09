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

// Export mergeSelects for cases where dynamic merging is still needed
export { mergeSelects } from './merge'

// Export const literals from modules
export { SELECT_BASE_WITH_PROFESSOR_INFO, SELECT_BASE } from './modules/base'
export { SELECT_QUESTION_TAGS } from './modules/tags'
export { SELECT_TYPE_SPECIFIC } from './modules/typeSpecific/index'
export {
  SELECT_OFFICIAL_ANSWERS,
  SELECT_CODE_MERGED_QUESTION,
  SELECT_MULTIPLE_CHOICE_MERGED_QUESTION,
  SELECT_TRUE_FALSE_MERGED_QUESTION,
  SELECT_ESSAY_MERGED_QUESTION,
  SELECT_WEB_MERGED_QUESTION,
  SELECT_EXACT_MATCH_MERGED_QUESTION,
  SELECT_DATABASE_MERGED_QUESTION,
} from './modules/officialAnswers'
export {
  SELECT_ALL_STUDENT_ANSWERS,
  SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING,
  SELECT_STUDENT_ANSWER_WITH_GRADING,
} from './modules/studentAnswers/index'
export { SELECT_STUDENT_GRADINGS } from './modules/gradings'

// Expose the select for question copy from the copy base
export { SELECT_FOR_QUESTION_COPY } from '@/code/question/copy/base'
