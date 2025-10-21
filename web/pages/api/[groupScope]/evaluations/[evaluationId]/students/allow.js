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
import {
  EvaluationPhase,
  Role,
  UserOnEvaluationAccessMode,
} from '@prisma/client'
import { withPrisma } from '@/middleware/withPrisma'
import {
  withMethodHandler,
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { phaseGT } from '@/code/phase'

/* 
Add particular student to the access list. 
In this scenario the student was denied access because he was not yet in the access list.
*/

const post = async (req, res, prisma) => {
  const { groupScope, evaluationId } = req.query
  const { studentEmail } = req.body

  const evaluation = await prisma.evaluation.findFirst({
    where: {
      id: evaluationId,
      group: {
        scope: groupScope,
      },
    },
    select: {
      phase: true,
      startAt: true,
      durationHours: true,
      durationMins: true,
      accessMode: true,
      accessList: true,
    },
  })

  if (!evaluation) {
    res.status(404).json({ message: 'Evaluation not found' })
    return
  }

  if (
    evaluation.accessMode !== UserOnEvaluationAccessMode.LINK_AND_ACCESS_LIST
  ) {
    res.status(400).json({ message: 'No access list' })
    return
  }

  if (phaseGT(evaluation.phase, EvaluationPhase.IN_PROGRESS)) {
    res
      .status(401)
      .json({ message: "It is too late to apologize. It's too late." })
    return
  }

  const accessList = evaluation.accessList || []

  await prisma.$transaction(async (prisma) => {
    if (!accessList.includes(studentEmail)) {
      accessList.push(studentEmail)

      // update access list

      await prisma.evaluation.update({
        where: {
          id: evaluationId,
        },
        data: {
          accessList: accessList,
        },
      })
    }
    try {
      // remove the denied access attempt
      await prisma.userOnEvaluationDeniedAccessAttempt.delete({
        where: {
          userEmail_evaluationId: {
            evaluationId: evaluationId,
            userEmail: studentEmail,
          },
        },
      })
    } catch (e) {
      // ignore if the user was not in the denied access list
    }
  })

  res.status(200).json({ message: 'Student added to the access list' })
}

export default withGroupScope(
  withMethodHandler({
    POST: withAuthorization(withPrisma(post), [Role.PROFESSOR]),
  }),
)
