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
import { EvaluationPhase, Role, UserOnEvaluationStatus } from '@prisma/client'

import { getUser } from '@/code/auth/auth'
import { isInProgress } from './questions/[questionId]/answers/utils'
import {
  withAuthorization,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'
import {
  withEvaluationPhase,
  withStudentStatus,
} from '@/middleware/withStudentEvaluation'
import { withRestrictions } from '@/middleware/withRestrictions'

/*
Get the details about thr evaluation for a users
get the list of questions of that evaluation including points oprder and question
Only shallow question is included (type, title,content ...) without type specific data (code, database, ...
No official answers are included and no question type specific at all
Each question has included the answer for that particular users only

*/

const get = withEvaluationPhase(
  [EvaluationPhase.IN_PROGRESS],
  withStudentStatus(
    [UserOnEvaluationStatus.IN_PROGRESS],
    async (req, res, prisma) => {
      const { evaluationId } = req.query
      const user = await getUser(req, res)

      const { email } = user

      if (!(await isInProgress(evaluationId, prisma))) {
        res.status(400).json({ message: 'evaluation is not in progress' })
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
              accessMode: true, // sensitive!
              accessList: true, // sensitive!
              evaluationToQuestions: {
                include: {
                  question: {
                    include: {
                      studentAnswer: {
                        where: {
                          userEmail: email,
                        },
                        select: {
                          status: true,
                        },
                      },
                    },
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
        res
          .status(403)
          .json({ message: 'You are not allowed to access this evaluation' })
        return
      }

      res.status(200).json(userOnEvaluation.evaluation.evaluationToQuestions)
    },
  ),
)

export default withMethodHandler({
  GET: withRestrictions(
    withAuthorization(withPrisma(get), [Role.PROFESSOR, Role.STUDENT]),
  ),
})
