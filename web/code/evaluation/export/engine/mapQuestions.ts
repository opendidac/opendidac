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

/**
 * Map evaluation to questions to student submissions.
 * @param etq - The evaluation to question.
 * @param student - The student.
 * @param email - The student's email.
 * @returns The student submission.
 */
import { StudentSubmission } from './types'
import { extractStudentAnswer } from './extract'

export function mapStudentQuestions<Q>(
  etq: any,
  student: any,
  email: string,
): StudentSubmission<Q> {
  const studentAnswer = extractStudentAnswer(etq.question.studentAnswer, email)

  return {
    student,
    question: { ...etq.question, title: etq.title },
    order: etq.order + 1,
    points: etq.points,
    studentAnswer,
    studentGrading: studentAnswer?.studentGrading ?? null,
  }
}
