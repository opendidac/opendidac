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
  SELECT_BASE_WITH_PROFESSOR_INFO,
  SELECT_TYPE_SPECIFIC,
  SELECT_OFFICIAL_ANSWERS,
} from '@/code/question/select'
import { SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING } from '@/code/question/select/modules/studentAnswers'

/**
 * Select clause for evaluation questions with optional gradings.
 * Used by grading, finished, and analytics pages.
 * Includes: type-specific data, official answers, professor-only info
 * Optionally includes: ALL student answers and gradings (when withGradings=true)
 */
const selectForEvaluationQuestions = (
  withGradings: boolean,
): Prisma.QuestionSelect => {
  const base = {
    ...SELECT_BASE_WITH_PROFESSOR_INFO,
    ...SELECT_TYPE_SPECIFIC,
    ...SELECT_OFFICIAL_ANSWERS,
  } as const satisfies Prisma.QuestionSelect

  if (withGradings) {
    return {
      ...base,
      ...SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING,
    } as const satisfies Prisma.QuestionSelect
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
