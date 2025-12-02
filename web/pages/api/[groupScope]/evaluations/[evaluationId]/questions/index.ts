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

import { Role, Prisma } from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import type { IApiContext } from '@/types/api'
import {
  mergeSelects,
  selectBase,
  selectTypeSpecific,
  selectOfficialAnswers,
  selectAllStudentAnswers,
  selectStudentGradings,
} from '@/code/question/select'

/**
 * Select clause for evaluation questions with optional gradings.
 * Used by grading, finished, and analytics pages.
 * Includes: type-specific data, official answers, professor-only info
 * Optionally includes: ALL student answers and gradings (when withGradings=true)
 */
const selectForEvaluationQuestions = (
  withGradings: boolean,
): Prisma.QuestionSelect => {
  const base = mergeSelects(
    selectBase({ includeProfessorOnlyInfo: true }),
    selectTypeSpecific(),
    selectOfficialAnswers(),
  )

  if (withGradings) {
    return mergeSelects(
      base,
      selectAllStudentAnswers(),
      selectStudentGradings(),
    )
  }

  return base
}

const get = async (ctx: IApiContext) => {
  const { req, res, prisma } = ctx
  const { groupScope, evaluationId, withGradings = 'false' } = req.query

  if (!evaluationId || typeof evaluationId !== 'string') {
    res.status(400).json({ message: 'Invalid evaluationId' })
    return
  }

  if (!groupScope || typeof groupScope !== 'string') {
    res.status(400).json({ message: 'Invalid groupScope' })
    return
  }

  const includeGradings = withGradings === 'true'

  const questions = await prisma.evaluationToQuestion.findMany({
    where: {
      evaluationId: evaluationId,
      question: {
        group: {
          scope: groupScope,
        },
      },
    },
    include: {
      question: {
        select: selectForEvaluationQuestions(includeGradings),
      },
    },
    orderBy: {
      order: 'asc',
    },
  })

  res.status(200).json(questions)
}

export default withApiContext({
  GET: withGroupScope(withAuthorization(get, { roles: [Role.PROFESSOR] })),
})
