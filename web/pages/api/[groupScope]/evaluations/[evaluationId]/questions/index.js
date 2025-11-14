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

import { Role } from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

import { IncludeStrategy, questionSelectClause } from '@/code/questions'

/*
used by the evaluation pages grading, finished and analytics to fetch the questions of the evaluation with official amswers
and include all users answers and gradings

*/
const get = async (ctx, args) => {
  const { req, res, prisma } = ctx
  const { groupScope, evaluationId, withGradings = 'false' } = req.query

  let questionIncludeOptions = {
    includeTypeSpecific: true,
    includeOfficialAnswers: true,
    includeProfessorOnlyInfo: true,
  }

  if (withGradings === 'true') {
    questionIncludeOptions.includeUserAnswers = {
      strategy: IncludeStrategy.ALL,
    }
    questionIncludeOptions.includeGradings = true
  }

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
        select: questionSelectClause(questionIncludeOptions),
      },
    },

    orderBy: {
      order: 'asc',
    },
  })
  res.status(200).json(questions)
}

export default withMethodHandler({
  GET: withGroupScope(
    withAuthorization(withPrisma(get), { roles: [Role.PROFESSOR] }),
  ),
})
