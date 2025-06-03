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
import { QuestionStatus, Role } from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'
import { withEvaluationUpdate } from '@/middleware/withUpdate'
import { questionIncludeClause } from '@/code/questions'

const get = async (req, res, prisma) => {
  const { evaluationId } = req.query

  let questionIncludeOptions = {
    includeTypeSpecific: true,
    includeOfficialAnswers: true,
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: {
      id: evaluationId,
    },
    include: {
      evaluationToQuestions: {
        include: {
          question: {
            include: {
              ...questionIncludeClause(questionIncludeOptions),
              sourceQuestion: {
                // Only Active
                where: {
                  status: QuestionStatus.ACTIVE,
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
  })

  for (const question of evaluation.evaluationToQuestions) {
    console.log('question', question)
  }

  if (!evaluation) {
    res.status(404).json({ message: 'Evaluation not found' })
    return
  }

  res.status(200).json(evaluation.evaluationToQuestions)
}

const post = async (req, res, prisma) => {
  // add a new question to a evaluation
  const { evaluationId } = req.query
  const { questionIds } = req.body

  // get the latest order of the questions in the collection
  let order = await prisma.evaluationToQuestion.count({
    where: {
      evaluationId: evaluationId,
    },
  })

  await prisma.$transaction(async (prisma) => {
    for (const questionId of questionIds) {
      // In case this question was already used in another collection, fine the last points assigned to it
      const latestPoints = await prisma.evaluationToQuestion.findFirst({
        where: {
          questionId: questionId,
        },
        orderBy: {
          order: 'desc',
        },
      })

      const points = latestPoints ? latestPoints.points : undefined

      await prisma.evaluationToQuestion.create({
        data: {
          evaluationId: evaluationId,
          questionId: questionId,
          points: points,
          order: order,
        },
      })

      order++
    }
  })

  const evaluationToQuestions = await prisma.evaluationToQuestion.findMany({
    where: {
      evaluationId: evaluationId,
    },
    include: {
      question: {
        include: questionIncludeClause({
          includeTypeSpecific: true,
          includeOfficialAnswers: false,
        }),
      },
    },
  })

  // using default value for points

  res.status(200).json(evaluationToQuestions)
}

const put = async (req, res, prisma) => {
  // update the collectionToQuestion
  const { evaluationToQuestion } = req.body

  await prisma.evaluationToQuestion.update({
    where: {
      evaluationId_questionId: {
        evaluationId: evaluationToQuestion.evaluationId,
        questionId: evaluationToQuestion.questionId,
      },
    },
    data: {
      points: parseFloat(evaluationToQuestion.points),
    },
  })

  res.status(200).json({ message: 'OK' })
}

const del = async (req, res, prisma) => {
  // delete a question from a collection
  const { evaluationId } = req.query
  const { questionId } = req.body

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
    // delete the collectionToQuestion
    const deleted = await prisma.evaluationToQuestion.delete({
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
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    POST: withAuthorization(withEvaluationUpdate(withPrisma(post)), [
      Role.PROFESSOR,
    ]),
    PUT: withAuthorization(withEvaluationUpdate(withPrisma(put)), [
      Role.PROFESSOR,
    ]),
    DELETE: withAuthorization(withEvaluationUpdate(withPrisma(del)), [
      Role.PROFESSOR,
    ]),
  }),
)
