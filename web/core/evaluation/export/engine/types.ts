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
import { selectForStudentExport, selectForProfessorExport } from './select'

export type UserPayload = Prisma.UserGetPayload<{}>

export type StudentAnswerPayload = Prisma.StudentAnswerGetPayload<{
  include: { studentGrading: true }
}>

export type QuestionPayloadStudent = Prisma.QuestionGetPayload<{
  select: ReturnType<typeof selectForStudentExport>
}>

export type QuestionPayloadProfessor = Prisma.QuestionGetPayload<{
  select: ReturnType<typeof selectForProfessorExport>
}>

export type QuestionWithMeta<Q> = {
  question: Q & { title: string }
  order: number
  points: number
}

export type StudentSubmission<Q> = QuestionWithMeta<Q> & {
  student: UserPayload
  studentAnswer: StudentAnswerPayload | null
  studentGrading: StudentAnswerPayload['studentGrading'] | null
}
