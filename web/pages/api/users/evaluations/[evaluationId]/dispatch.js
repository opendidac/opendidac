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

import { Role, EvaluationPhase } from '@prisma/client'
import { withPrisma } from '@/middleware/withPrisma'
import {
  withMethodHandler,
  withAuthorization,
} from '@/middleware/withAuthorization'

import { phaseGT } from '@/code/phase'
import { getUser } from '@/code/auth/auth'
import { withRestrictions } from '@/middleware/withRestrictions'
import { withEvaluation } from '@/middleware/withEvaluation'

/*
fetch the informations necessary to decide where the users should be redirected
based on the phase of the evaluation and the relation between the users and the evaluation
Will respond with the Evaluation phase and the UserOnEvaluation object
* */
const get = async (ctx, args) => {
  const { req, res, prisma, evaluation } = ctx
  const { evaluationId } = req.query

  const user = await getUser(req, res)

  const userOnEvaluation = await prisma.userOnEvaluation.findFirst({
    where: {
      evaluationId: evaluationId,
      userEmail: user.email,
    },
  })

  if (!userOnEvaluation) {
    if (phaseGT(evaluation.phase, EvaluationPhase.IN_PROGRESS)) {
      // the users is not in the evaluation, and the evaluation after the in progress phase
      res
        .status(401)
        .json({ message: "It is too late to apologize. It's too late." })
      return
    }
    // the users is not in the evaluation, but its not to late to join
    // the response is still ok
    res.status(200).json({
      evaluation: evaluation,
      userOnEvaluation: null,
    })
    return
  }

  // the users is already in the evaluation
  res.status(200).json({
    evaluation: {
      phase: evaluation.phase,
      label: evaluation.label,
    },
    userOnEvaluation: userOnEvaluation,
  })
}

export default withMethodHandler({
  GET: withEvaluation(
    withRestrictions(
      withAuthorization(withPrisma(get), {
        roles: [Role.PROFESSOR, Role.STUDENT],
      }),
    ),
  ),
})
