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
import type { IApiContext } from '@/types/api'
import { withPurgeGuard } from '@/middleware/withPurged'
import { withEvaluation } from '@/middleware/withEvaluation'
import {
  mergeSelects,
  selectBase,
  selectQuestionTags,
  selectTypeSpecific,
  selectOfficialAnswers,
  selectStudentAnswersForUser,
  selectStudentGradings,
} from '@/code/question/select'

/**
 * Select clause for professor consulting a specific user's answers
 * Includes: type-specific data, official answers, professor-only info,
 *           specific user's answers, and gradings.
 */
const selectForProfessorConsultation = (
  userEmail: string,
): Prisma.QuestionSelect => {
  return mergeSelects(
    selectBase({ includeProfessorOnlyInfo: true }),
    selectTypeSpecific(),
    selectOfficialAnswers(),
    selectStudentAnswersForUser(userEmail),
    selectStudentGradings(),
    selectQuestionTags(),
  )
}

/*
  Professor can consult the user's answers to the questions of an evaluation
*/
const get = async (ctx: IApiContext) => {
  const { req, res, prisma } = ctx
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
            select: selectForProfessorConsultation(userEmail),
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
