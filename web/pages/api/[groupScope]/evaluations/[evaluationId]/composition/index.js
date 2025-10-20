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
import { questionSelectClause } from '@/code/questions'

const get = async (req, res, prisma) => {
  const { evaluationId } = req.query

  let questionIncludeOptions = {
    includeTypeSpecific: true,
    includeOfficialAnswers: true,
    includeProfessorOnlyInfo: true,
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: {
      id: evaluationId,
    },
    include: {
      evaluationToQuestions: {
        include: {
          question: {
            select: {
              ...questionSelectClause(questionIncludeOptions),
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

      // Get the question title to initialize the custom title
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { title: true },
      })

      if (!question) {
        throw new Error(`Question with id ${questionId} not found`)
      }

      await prisma.evaluationToQuestion.create({
        data: {
          evaluationId: evaluationId,
          questionId: questionId,
          points: points,
          gradingPoints: points,
          order: order,
          title: question.title, // Initialize with original question title
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
        select: questionSelectClause({
          includeTypeSpecific: true,
          includeOfficialAnswers: false,
          includeProfessorOnlyInfo: true,
        }),
      },
    },
  })

  // using default value for points

  res.status(200).json(evaluationToQuestions)
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    POST: withAuthorization(withEvaluationUpdate(withPrisma(post)), [
      Role.PROFESSOR,
    ]),
  }),
)
