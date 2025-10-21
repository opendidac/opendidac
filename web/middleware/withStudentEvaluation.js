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

import { getUser } from '@/code/auth/auth'
import { getPrisma } from './withPrisma'

export function withStudentStatus(allowedStatuses = [], handler) {
  const prisma = getPrisma()

  return async (req, res) => {
    const user = await getUser(req, res)
    if (!user) {
      return res.status(403).json({ message: 'Access denied.' })
    }
    const { evaluationId } = req.query // or get these from the session/user context

    const userOnEvaluation = await prisma.userOnEvaluation.findUnique({
      where: {
        userEmail_evaluationId: {
          userEmail: user.email,
          evaluationId,
        },
      },
    })

    if (
      !userOnEvaluation ||
      !allowedStatuses.includes(userOnEvaluation.status)
    ) {
      return res
        .status(403)
        .json({ message: 'The student has finished the evaluation' })
    }

    // Continue with the original handler
    await handler(req, res, prisma)
  }
}

export function withEvaluationPhase(allowedPhases = [], handler) {
  const prisma = getPrisma()

  return async (req, res) => {
    const { evaluationId } = req.query

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
    })

    if (!evaluation || !allowedPhases.includes(evaluation.phase)) {
      return res
        .status(403)
        .json({ message: 'Access denied due to evaluation phase.' })
    }

    // Continue with the original handler if the phase is allowed
    await handler(req, res, prisma)
  }
}
