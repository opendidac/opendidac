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
import { mergeSelects } from '@/code/question/select/merge'
import { buildBase } from './modules/base'
import { buildQuestionTags } from './modules/tags'
import { buildTypeSpecific } from './modules/typeSpecific'
import { buildOfficialAnswers } from './modules/officialAnswers'
import { buildAllStudentAnswers } from './modules/studentAnswers'
import { buildStudentGradings } from './modules/gradings'

/**
 * Use-case-specific functions for building question select clauses.
 * Each function represents a specific view/use case in the application.
 *
 * Instead of passing boolean options, use these semantic functions that
 * clearly express the intent of each query.
 */

/**
 * Use case: Professor editing a question
 * Used in: pages/api/[groupScope]/questions/[questionId]/index.js (GET)
 * Includes: type-specific data, official answers, professor-only info
 */
export const selectForProfessorEditing = (): Prisma.QuestionSelect => {
  return mergeSelects(
    buildBase({ includeProfessorOnlyInfo: true }),
    buildQuestionTags(),
    buildTypeSpecific(),
    buildOfficialAnswers(),
  )
}

/**
 * Use case: Professor listing questions
 * Used in: pages/api/[groupScope]/questions/index.ts (GET, POST)
 * Includes: type-specific data, official answers, professor-only info
 */
export const selectForProfessorListing = (): Prisma.QuestionSelect => {
  return mergeSelects(
    buildBase({ includeProfessorOnlyInfo: true }),
    buildTypeSpecific(),
    buildQuestionTags(),
  )
}

/**
 * Use case: Professor tracking progress during evaluation
 * Used in: pages/api/[groupScope]/evaluations/[evaluationId]/progress/index.js
 * Includes: type-specific, official answers, ALL user answers, gradings, professor-only info
 */
export const selectForProfessorProgressTracking = (): Prisma.QuestionSelect => {
  return mergeSelects(
    buildBase({ includeProfessorOnlyInfo: true }),
    buildQuestionTags(),
    buildTypeSpecific(),
    buildOfficialAnswers(),
    buildAllStudentAnswers(),
    buildStudentGradings(),
  )
}

/**
 * Use case: Professor viewing evaluation results
 * Used in: pages/api/[groupScope]/evaluations/[evaluationId]/results/index.js
 * Includes: type-specific, official answers, ALL user answers, gradings, professor-only info
 */
export const selectForProfessorResults = (): Prisma.QuestionSelect => {
  return mergeSelects(
    buildBase({ includeProfessorOnlyInfo: true }),
    buildQuestionTags(),
    buildTypeSpecific(),
    buildOfficialAnswers(),
    buildAllStudentAnswers(), // previously include strategy ALL
    buildStudentGradings(),
  )
}

/**
 * Use case: Professor viewing questions in evaluation (without gradings)
 * Used in: pages/api/[groupScope]/evaluations/[evaluationId]/questions/index.js (GET)
 * Includes: type-specific, official answers, professor-only info
 */
export const selectForProfessorEvaluationQuestions =
  (): Prisma.QuestionSelect => {
    return mergeSelects(
      buildBase({ includeProfessorOnlyInfo: true }),
      buildQuestionTags(),
      buildTypeSpecific(),
      buildOfficialAnswers(),
    )
  }

/**
 * Use case: Professor adding questions to evaluation
 * Used in: pages/api/[groupScope]/evaluations/[evaluationId]/questions/index.js (POST)
 * Includes: type-specific, professor-only info (no official answers)
 */
export const selectForProfessorAddingToEvaluation =
  (): Prisma.QuestionSelect => {
    return mergeSelects(
      buildBase({ includeProfessorOnlyInfo: true }),
      buildQuestionTags(),
      buildTypeSpecific(),
    )
  }

/**
 * Use case: Professor viewing questions in evaluation (with optional gradings)
 * Used in: pages/api/[groupScope]/evaluations/[evaluationId]/questions/index.js (GET with withGradings param)
 * Includes: type-specific, official answers, professor-only info, optionally ALL user answers + gradings
 */
export const selectForProfessorEvaluationQuestionsWithGradings =
  (): Prisma.QuestionSelect => {
    return mergeSelects(
      buildBase({ includeProfessorOnlyInfo: true }),
      buildQuestionTags(),
      buildTypeSpecific(),
      buildOfficialAnswers(),
      buildAllStudentAnswers(), // previously include strategy ALL

      buildStudentGradings(),
    )
  }

/**
 * Use case: Professor copying a question
 * Used in: pages/api/[groupScope]/questions/[questionId]/copy.js
 * Includes: type-specific, official answers, tags, professor-only info
 */
export const selectForProfessorCopying = (): Prisma.QuestionSelect => {
  return mergeSelects(
    buildBase({ includeProfessorOnlyInfo: true }),
    buildQuestionTags(),
    buildTypeSpecific(),
    buildOfficialAnswers(),
  )
}

/**
 * Use case: Copying questions for evaluation phase transition
 * Used in: pages/api/[groupScope]/evaluations/[evaluationId]/phase.js
 * Includes: type-specific, official answers, tags, professor-only info
 */
export const selectForEvaluationPhaseCopy = (): Prisma.QuestionSelect => {
  return mergeSelects(
    buildBase({ includeProfessorOnlyInfo: true }),
    buildQuestionTags(),
    buildTypeSpecific(),
    buildOfficialAnswers(),
  )
}

/**
 * Use case: Student joining an evaluation
 * Used in: pages/api/users/evaluations/[evaluationId]/join.js
 * Includes: type-specific, official answers (for initialization)
 */
export const selectForStudentJoining = (): Prisma.QuestionSelect => {
  return mergeSelects(
    buildBase({}),
    buildQuestionTags(),
    buildTypeSpecific(),
    buildOfficialAnswers(),
  )
}

/**
 * Use case: Student exporting their evaluation
 * Used in: pages/api/users/evaluations/[evaluationId]/export.js
 * Includes: type-specific, NO official answers, user-specific answers, gradings
 */
export const selectForStudentExport = (
  userEmail: string,
): PrismaSelectWrapper => {
  const userAnswers = {
    strategy: IncludeStrategy.USER_SPECIFIC,
    userEmail,
  }
  return mergeSelects(
    buildBase({}),
    buildQuestionTags(),
    buildTypeSpecific(),
    buildUserAnswers({
      includeUserAnswers: userAnswers,
      includeOfficialAnswers: false,
      includeGradings: true,
    }),
    buildGradings({
      includeGradings: true,
      includeUserAnswers: userAnswers,
    }),
  )
}

/**
 * Use case: Student consulting finished evaluation
 * Used in: pages/api/users/evaluations/[evaluationId]/consult.js
 * Includes: type-specific, conditional official answers, user-specific answers, gradings
 */
export const selectForStudentConsultation = (
  userEmail: string,
  showSolutions: boolean,
): PrismaSelectWrapper => {
  const userAnswers = {
    strategy: IncludeStrategy.USER_SPECIFIC,
    userEmail,
  }
  const selects = [
    buildBase({}),
    buildQuestionTags(),
    buildTypeSpecific(),
    buildUserAnswers({
      includeUserAnswers: userAnswers,
      includeOfficialAnswers: showSolutions,
      includeGradings: true,
    }),
    buildGradings({
      includeGradings: true,
      includeUserAnswers: userAnswers,
    }),
  ]
  if (showSolutions) {
    selects.push(buildOfficialAnswers())
  }
  return mergeWrappers(...selects)
}

/**
 * Use case: Professor exporting evaluation (all students)
 * Used in: pages/api/[groupScope]/evaluations/[evaluationId]/export.js
 * Includes: type-specific, official answers, ALL user answers (if not purged), gradings (if not purged)
 */
export const selectForProfessorExport = (
  includeStudentSubmissions: boolean,
): PrismaSelectWrapper => {
  const selects = [
    buildBase({}),
    buildQuestionTags(),
    buildTypeSpecific(),
    buildOfficialAnswers(),
  ]
  if (includeStudentSubmissions) {
    const userAnswers = { strategy: IncludeStrategy.ALL }
    selects.push(
      buildUserAnswers({
        includeUserAnswers: userAnswers,
        includeOfficialAnswers: true,
        includeGradings: true,
      }),
      buildGradings({
        includeGradings: true,
        includeUserAnswers: userAnswers,
      }),
    )
  }
  return mergeSelects(...selects)
}

/**
 * Use case: Professor consulting a specific student's answers
 * Used in: pages/api/[groupScope]/evaluations/[evaluationId]/consult/[userEmail].js
 * Includes: type-specific, official answers, user-specific answers, gradings, professor-only info
 */
export const selectForProfessorConsultingStudent = (
  userEmail: string,
): PrismaSelectWrapper => {
  const userAnswers = {
    strategy: IncludeStrategy.USER_SPECIFIC,
    userEmail,
  }
  return mergeSelects(
    buildBase({ includeProfessorOnlyInfo: true }),
    buildQuestionTags(),
    buildTypeSpecific(),
    buildOfficialAnswers(),
    buildUserAnswers({
      includeUserAnswers: userAnswers,
      includeOfficialAnswers: true,
      includeGradings: true,
    }),
    buildGradings(),
  )
}

/**
 * Use case: Question import/export
 * Used in: code/questionsImportExport.js
 * Includes: type-specific, official answers, professor-only info (no user answers, no gradings, no tags)
 */
export const selectForQuestionExport = (): PrismaSelectWrapper => {
  return mergeSelects(
    buildBase({ includeProfessorOnlyInfo: true }),
    buildTypeSpecific(),
    buildOfficialAnswers(),
  )
}
