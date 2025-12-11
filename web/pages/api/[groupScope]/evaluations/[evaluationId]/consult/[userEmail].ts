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

import type { NextApiRequest, NextApiResponse } from 'next'
import { Role, Prisma } from '@prisma/client'
import { withAuthorization } from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import type { IApiContext } from '@/core/types/api'
import { withPurgeGuard } from '@/middleware/withPurged'
import { withEvaluation } from '@/middleware/withEvaluation'

import {
  SELECT_BASE_WITH_PROFESSOR_INFO,
  SELECT_QUESTION_TAGS,
  SELECT_TYPE_SPECIFIC,
  SELECT_OFFICIAL_ANSWERS,
} from '@/core/question/select'

import { SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING } from '@/core/question/select/modules/studentAnswers'

/**
 * Base literal for professor consultation.
 * This stays deep-typed and reusable.
 */
export const SELECT_FOR_PROFESSOR_CONSULTATION = {
  ...SELECT_BASE_WITH_PROFESSOR_INFO,
  ...SELECT_TYPE_SPECIFIC,
  ...SELECT_OFFICIAL_ANSWERS,
  ...SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING,
  ...SELECT_QUESTION_TAGS,
} as const satisfies Prisma.QuestionSelect

/**
 * Creates the per-user select by PATCHING the dynamic filter.
 * The select stays 100% inferred from the literal above.
 */
const buildSelectForProfessorConsultation = (
  userEmail: string,
): Prisma.QuestionSelect => ({
  ...SELECT_FOR_PROFESSOR_CONSULTATION,
  studentAnswer: {
    ...SELECT_FOR_PROFESSOR_CONSULTATION.studentAnswer,
    where: { userEmail },
  },
})
/*
  Professor can consult the user's answers to the questions of an evaluation
*/
const get = async (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: IApiContext,
) => {
  const { prisma } = ctx
  const { evaluationId, userEmail } = req.query

  if (!evaluationId || typeof evaluationId !== 'string') {
    res.status(400).json({ message: 'Invalid evaluationId' })
    return
  }

  if (!userEmail || typeof userEmail !== 'string') {
    res.status(400).json({ message: 'Invalid userEmail' })
    return
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: {
      id: evaluationId,
    },
    include: {
      evaluationToQuestions: {
        include: {
          question: {
            select: buildSelectForProfessorConsultation(userEmail),
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  })

  if (!evaluation) {
    res.status(404).json({ message: 'Evaluation not found' })
    return
  }

  res.status(200).json(evaluation)
}

export default withApiContext({
  GET: withEvaluation(
    withAuthorization(withPurgeGuard(get), {
      roles: [Role.PROFESSOR],
    }),
  ),
})
