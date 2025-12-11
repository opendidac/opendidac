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

import type { NextApiRequest, NextApiResponse } from 'next'
import { QuestionStatus, Role, Prisma } from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import type { IApiContext } from '@/core/types/api'
import { withEvaluationUpdate } from '@/middleware/withUpdate'
import {
  SELECT_BASE_WITH_PROFESSOR_INFO,
  SELECT_TYPE_SPECIFIC,
  SELECT_QUESTION_TAGS,
} from '@/core/question/select'

/**
 * Select clause for professor listing questions
 * Includes: type-specific data, tags, professor-only info
 * Note: Does NOT include official answers (not needed for listing)
 */
const SELECT_FOR_PROFESSOR_LISTING = {
  ...SELECT_BASE_WITH_PROFESSOR_INFO,
  ...SELECT_TYPE_SPECIFIC,
  ...SELECT_QUESTION_TAGS,
} as const satisfies Prisma.QuestionSelect

interface PostBody {
  questionIds: string[]
}

const get = async (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: IApiContext,
) => {
  const { prisma } = ctx
  const { evaluationId } = req.query

  if (!evaluationId || typeof evaluationId !== 'string') {
    res.status(400).json({ message: 'Invalid evaluationId' })
    return
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
              ...SELECT_FOR_PROFESSOR_LISTING,
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

const post = async (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: IApiContext,
) => {
  const { prisma } = ctx
  // add a new question to a evaluation
  const { evaluationId } = req.query
  const body = req.body as PostBody
  const { questionIds } = body

  if (!evaluationId || typeof evaluationId !== 'string') {
    res.status(400).json({ message: 'Invalid evaluationId' })
    return
  }

  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    res.status(400).json({ message: 'questionIds must be a non-empty array' })
    return
  }

  // get the latest order of the questions in the collection
  let order = await prisma.evaluationToQuestion.count({
    where: {
      evaluationId: evaluationId,
    },
  })

  await prisma.$transaction(async (tx) => {
    for (const questionId of questionIds) {
      // In case this question was already used in another collection, fine the last points assigned to it
      const latestPoints = await tx.evaluationToQuestion.findFirst({
        where: {
          questionId: questionId,
        },
        orderBy: {
          order: 'desc',
        },
      })

      const points = latestPoints ? latestPoints.points : undefined

      // Get the question title to initialize the custom title
      const question = await tx.question.findUnique({
        where: { id: questionId },
        select: { title: true },
      })

      if (!question) {
        throw new Error(`Question with id ${questionId} not found`)
      }

      await tx.evaluationToQuestion.create({
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
        select: SELECT_FOR_PROFESSOR_LISTING,
      },
    },
  })

  // using default value for points

  res.status(200).json(evaluationToQuestions)
}

export default withApiContext({
  GET: withGroupScope(withAuthorization(get, { roles: [Role.PROFESSOR] })),
  POST: withGroupScope(
    withAuthorization(withEvaluationUpdate(post), {
      roles: [Role.PROFESSOR],
    }),
  ),
})
