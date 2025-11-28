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
 * Internal helper for grading selection inside StudentAnswer.
 * Not exported. Not reused outside this module (for now).
 */
const buildStudentGradingSelect = (): Prisma.StudentQuestionGradingSelect => {
  return {
    status: true,
    pointsObtained: true,
    comment: true,
    signedBy: true, // professor user object
  }
}

/**
 * Builds grading selection for professor grading view.
 * Returns the grading info on each studentAnswer.
 */
export const buildStudentGradings = (): Prisma.QuestionSelect => {
  return {
    studentAnswer: {
      select: {
        studentGrading: {
          select: buildStudentGradingSelect(),
        },
      },
    },
  }
}
