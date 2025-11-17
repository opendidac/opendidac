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
import { withAuthorization } from '@/middleware/withAuthorization'
import { withMethodHandler } from '@/middleware/withMethodHandler'
import { withPrisma } from '@/middleware/withPrisma'
import { withRestrictions } from '@/middleware/withRestrictions'
import { withEvaluation } from '@/middleware/withEvaluation'
import {
  withEvaluationPhase,
  withStudentStatus,
} from '@/middleware/withStudentEvaluation'
import { EvaluationPhase, Role, UserOnEvaluationStatus } from '@prisma/client'

// This function handles session tracking and session change detection for a user in an evaluation
async function trackSessionChanges(
  prisma,
  userId,
  studentEmail,
  evaluationId,
  userOnEvaluation,
) {
  // Fetch the current session of the user
  const currentSession = await prisma.session.findFirst({
    where: { userId: userId },
    select: { sessionToken: true },
  })

  const sessionToken = currentSession?.sessionToken

  // If there's no session token, we can't track session changes
  if (!sessionToken) {
    return
  }

  // If the originalSessionToken is not set, store the current session as the original token
  if (!userOnEvaluation.originalSessionToken) {
    await prisma.userOnEvaluation.update({
      where: {
        userEmail_evaluationId: {
          userEmail: studentEmail,
          evaluationId: evaluationId,
        },
      },
      data: {
        originalSessionToken: sessionToken, // Store the current session token as the original one
      },
    })
  } else if (sessionToken !== userOnEvaluation.originalSessionToken) {
    // If the current session token differs from the original one, detect a session change
    await prisma.userOnEvaluation.update({
      where: {
        userEmail_evaluationId: {
          userEmail: studentEmail,
          evaluationId: evaluationId,
        },
      },
      data: {
        hasSessionChanged: true, // Mark that a session change has occurred
        sessionChangeDetectedAt: new Date(), // Log the time of session change
        originalSessionToken: sessionToken, // Update the original session token to the current one
      },
    })
  }
}

// The main endpoint for getting student status
const get = async (ctx, args) => {
  const { req, res, prisma, evaluation } = ctx
  const user = await getUser(req, res)
  const { email: studentEmail, id: userId } = user
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
      originalSessionToken: true,
    },
  })

  if (!userOnEvaluation) {
    res.status(404).json({ message: 'User not found in evaluation' })
    return
  }
  // Check if the evaluation is in the "IN_PROGRESS" phase
  if (evaluation.phase === EvaluationPhase.IN_PROGRESS) {
    // Call the session tracking function
    await trackSessionChanges(
      prisma,
      userId,
      studentEmail,
      evaluationId,
      userOnEvaluation,
    )
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
const put = async (ctx, args) => {
  const { req, res, prisma } = ctx
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

export default withMethodHandler({
  GET: withPrisma(
    withEvaluation(
      withRestrictions(
        withAuthorization(get, {
          roles: [Role.PROFESSOR, Role.STUDENT],
        }),
      ),
    ),
  ),
  PUT: withPrisma(
    withEvaluation(
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
  ),
})
