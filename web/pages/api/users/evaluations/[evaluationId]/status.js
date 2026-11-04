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

import { getUser } from '@/core/auth/auth'
import { withAuthorization } from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import { withRestrictions } from '@/middleware/withRestrictions'
import { withEvaluation } from '@/middleware/withEvaluation'
import {
  withEvaluationPhase,
  withStudentStatus,
} from '@/middleware/withStudentEvaluation'
import { EvaluationPhase, Role, UserOnEvaluationStatus } from '@prisma/client'

// The main endpoint for getting student status
const get = async (req, res, ctx) => {
  const { prisma, evaluation } = ctx
  const user = await getUser(req, res)
  const { email: studentEmail } = user
  const { evaluationId } = req.query

  // Fetch user's participation in the evaluation
  const userOnEvaluation = await prisma.userOnEvaluation.findUnique({
    where: {
      userEmail_evaluationId: {
        userEmail: studentEmail,
        evaluationId: evaluationId,
      },
    },
    select: {
      status: true,
    },
  })

  if (!userOnEvaluation) {
    res.status(404).json({ message: 'User not found in evaluation' })
    return
  }

  // Return only the evaluation fields needed by students (exclude sensitive admin fields)
  res.status(200).json({
    evaluation: {
      id: evaluation.id,
      phase: evaluation.phase,
      label: evaluation.label,
      durationActive: evaluation.durationActive,
      startAt: evaluation.startAt,
      endAt: evaluation.endAt,
      conditions: evaluation.conditions,
    },
    userOnEvaluation: {
      status: userOnEvaluation.status,
    },
  })
}

// student ends his evaluation
const put = async (req, res, ctx) => {
  const { prisma } = ctx
  const user = await getUser(req, res)
  const studentEmail = user.email
  const { evaluationId } = req.query

  await prisma.userOnEvaluation.update({
    where: {
      userEmail_evaluationId: {
        userEmail: studentEmail,
        evaluationId: evaluationId,
      },
    },
    data: {
      status: UserOnEvaluationStatus.FINISHED,
      finishedAt: new Date(),
    },
  })

  res.status(200).json({ message: 'Evaluation completed' })
}

export default withApiContext({
  GET: withEvaluation(
    withRestrictions(
      withAuthorization(get, {
        roles: [Role.PROFESSOR, Role.STUDENT],
      }),
    ),
  ),
  PUT: withEvaluation(
    withRestrictions(
      withAuthorization(
        withEvaluationPhase(
          withStudentStatus(put, {
            statuses: [UserOnEvaluationStatus.IN_PROGRESS],
          }),
          { phases: [EvaluationPhase.IN_PROGRESS] },
        ),
        { roles: [Role.PROFESSOR, Role.STUDENT] },
      ),
    ),
  ),
})
