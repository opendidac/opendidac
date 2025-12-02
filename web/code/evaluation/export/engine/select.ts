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

import { mergeSelects } from '@/code/question/select'
import { selectBase } from '@/code/question/select'
import { selectTypeSpecific } from '@/code/question/select'
import { selectStudentAnswersForUser } from '@/code/question/select'
import { selectStudentGradings } from '@/code/question/select'
import { selectQuestionTags } from '@/code/question/select'
import { selectAllStudentAnswers } from '@/code/question/select'
import { selectOfficialAnswers } from '@/code/question/select'

/**
 * Select for student export.
 * @param email - The student's email.
 * @returns The select for student export.
 */
export const selectForStudentExport = (email: string) =>
  mergeSelects(
    selectBase({ includeProfessorOnlyInfo: false }),
    selectTypeSpecific(),
    selectStudentAnswersForUser(email),
    selectStudentGradings(),
    selectQuestionTags(),
  )

export const selectForProfessorExport = (includeSubs: boolean) => {
  const base = mergeSelects(
    selectBase({ includeProfessorOnlyInfo: true }),
    selectTypeSpecific(),
    selectOfficialAnswers(),
    selectQuestionTags(),
  )

  return includeSubs
    ? mergeSelects(base, selectAllStudentAnswers(), selectStudentGradings())
    : base
}
