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
import { withAuthorization } from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import type { IApiContext, IApiContextWithEvaluation } from '@/types/api'
import { withRestrictions } from '@/middleware/withRestrictions'
import { withEvaluation } from '@/middleware/withEvaluation'
import { withPurgeGuard } from '@/middleware/withPurged'

import { getUser } from '@/code/auth/auth'
import {
  SELECT_BASE,
  SELECT_QUESTION_TAGS,
  SELECT_TYPE_SPECIFIC,
  SELECT_OFFICIAL_ANSWERS,
} from '@/code/question/select'
import { selectStudentAnswersForUserWithGrading } from '@/code/question/select/modules/studentAnswers'
import { isFinished } from './questions/[questionId]/answers/utils'

/**
 * Select clause for student consulting their own answers after evaluation is finished.
 * Includes: type-specific data, student's own answers, gradings
 * Conditionally includes: official answers (if showSolutionsWhenFinished is true)
 * Note: Does NOT include professor-only info (title, scratchpad)
 */
const selectForStudentConsultation = (
  userEmail: string,
  includeOfficialAnswers: boolean,
): Prisma.QuestionSelect => {
  const base = {
    ...SELECT_BASE,
    ...SELECT_TYPE_SPECIFIC,
    ...selectStudentAnswersForUserWithGrading(userEmail),
    ...SELECT_QUESTION_TAGS,
  } as const satisfies Prisma.QuestionSelect

  if (includeOfficialAnswers) {
    return {
      ...base,
      ...SELECT_OFFICIAL_ANSWERS,
    } as const satisfies Prisma.QuestionSelect
  }

  return base
}

const get = async (ctx: IApiContextWithEvaluation | IApiContext) => {
  const { req, res, prisma } = ctx
  const { evaluationId } = req.query

  if (!evaluationId || typeof evaluationId !== 'string') {
    res.status(400).json({ message: 'Invalid evaluationId' })
    return
  }

  // evaluation is guaranteed to be present when evaluationId is in the URL
  if (!('evaluation' in ctx)) {
    res.status(500).json({ message: 'Evaluation not found in context' })
    return
  }

  const { evaluation } = ctx

  const user = await getUser(req, res)

  if (!user || !user.email) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const email = user.email

  if (!(await isFinished(evaluationId, prisma))) {
    res.status(400).json({ message: 'Exam session is not finished' })
    return
  }

  // If consultation is disabled, prevent access
  if (!evaluation.consultationEnabled) {
    res.status(403).json({
      message: 'Consultation is disabled for this evaluation.',
    })
    return
  }

  const userOnEvaluation = await prisma.userOnEvaluation.findUnique({
    where: {
      userEmail_evaluationId: {
        userEmail: email,
        evaluationId: evaluationId,
      },
    },
    include: {
      evaluation: {
        select: {
          showSolutionsWhenFinished: true,
          evaluationToQuestions: {
            select: {
              points: true,
              order: true,
              addendum: true,
              title: true,
              question: {
                select: selectForStudentConsultation(
                  email,
                  evaluation.showSolutionsWhenFinished,
                ),
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      },
    },
  })

  if (!userOnEvaluation) {
    res.status(403).json({
      message: 'You are not allowed to access this evaluation',
    })
    return
  }

  res.status(200).json(userOnEvaluation.evaluation)
}

export default withApiContext({
  GET: withEvaluation(
    withRestrictions(
      withAuthorization(withPurgeGuard(get), {
        roles: [Role.PROFESSOR, Role.STUDENT],
      }),
    ) as any,
  ),
})
