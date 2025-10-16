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
import { withEvaluationUpdate } from '@/middleware/withUpdate'

const put = async (req, res, prisma) => {
  // update the evaluationToQuestion
  const { evaluationId, questionId } = req.query
  const body = req.body

  const allowedFields = ['points', 'title', 'weightedPoints']

  const data = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key)),
  )

  await prisma.evaluationToQuestion.update({
    where: {
      evaluationId_questionId: {
        evaluationId: evaluationId,
        questionId: questionId,
      },
    },
    data: data,
  })

  res.status(200).json({ message: 'OK' })
}

const del = async (req, res, prisma) => {
  // delete a question from an evaluation
  const { evaluationId, questionId } = req.query

  // get the order of this question in the evaluation
  const order = await prisma.evaluationToQuestion.findFirst({
    where: {
      AND: [{ evaluationId: evaluationId }, { questionId: questionId }],
    },
    orderBy: {
      order: 'asc',
    },
  })

  if (!order) {
    res.status(404).json({ message: 'question not found' })
    return
  }

  await prisma.$transaction(async (prisma) => {
    // delete the evaluationToQuestion
    await prisma.evaluationToQuestion.delete({
      where: {
        evaluationId_questionId: {
          evaluationId: evaluationId,
          questionId: questionId,
        },
      },
    })
    // decrement the order of all questions that were after the deleted question
    await prisma.evaluationToQuestion.updateMany({
      where: {
        AND: [{ evaluationId: evaluationId }, { order: { gt: order.order } }],
      },
      data: {
        order: {
          decrement: 1,
        },
      },
    })
  })

  res.status(200).json({ message: 'OK' })
}

export default withGroupScope(
  withMethodHandler({
    PUT: withAuthorization(withEvaluationUpdate(withPrisma(put)), [
      Role.PROFESSOR,
    ]),
    DELETE: withAuthorization(withEvaluationUpdate(withPrisma(del)), [
      Role.PROFESSOR,
    ]),
  }),
)
