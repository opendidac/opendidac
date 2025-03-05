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
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

import { getUser } from '@/code/auth/auth'
import { questionIncludeClause, IncludeStrategy } from '@/code/questions'
import { isFinished } from './questions/[questionId]/answers/utils'

const get = async (req, res, prisma) => {
  const { evaluationId } = req.query
  const { email } = await getUser(req, res)

  if (!(await isFinished(evaluationId, prisma))) {
    res.status(400).json({ message: 'Exam session is not finished' })
    return
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: {
      id: evaluationId,
    },
  })

  if (!evaluation) {
    res.status(404).json({ message: 'Evaluation not found' })
    return
  }

  // If consultation is disabled, prevent access
  if (!evaluation.consultationEnabled) {
    res.status(403).json({
      message: 'Consultation is disabled for this evaluation.',
    })
    return
  }

  let includeQuestions = questionIncludeClause({
    includeTypeSpecific: true,
    includeOfficialAnswers: evaluation.showSolutionsWhenFinished,
    includeUserAnswers: {
      strategy: IncludeStrategy.USER_SPECIFIC,
      userEmail: email,
    },
    includeGradings: true,
  })

  const userOnEvaluation = await prisma.userOnEvaluation.findUnique({
    where: {
      userEmail_evaluationId: {
        userEmail: email,
        evaluationId: evaluationId,
      },
    },
    include: {
      evaluation: {
        include: {
          evaluationToQuestions: {
            include: {
              question: {
                include: includeQuestions,
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
      message: 'You are not allowed to access this collections session',
    })
    return
  }
  res.status(200).json(userOnEvaluation.evaluation)
}

export default withMethodHandler({
  GET: withAuthorization(withPrisma(get), [Role.PROFESSOR, Role.STUDENT]),
})
