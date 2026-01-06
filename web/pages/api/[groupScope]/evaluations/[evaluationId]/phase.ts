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
import {
  EvaluationPhase,
  QuestionSource,
  QuestionUsageStatus,
  Role,
  Prisma,
  PrismaClient,
} from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import type { IApiContext } from '@/core/types/api'
import { copyQuestion } from '@/core/question/copy'
import { SELECT_FOR_QUESTION_COPY } from '@/core/question/select'

// Compute duration delta in milliseconds from activation flag, hours and minutes
function computeDurationDeltaMs(
  durationActive: boolean | null,
  durationHours: number | null,
  durationMins: number | null,
): number {
  if (!durationActive) return 0
  const hoursNum = Number(durationHours || 0)
  const minsNum = Number(durationMins || 0)
  const totalMs = (hoursNum * 60 + minsNum) * 60 * 1000
  return totalMs > 0 ? totalMs : 0
}

const copyQuestionsForEvaluation = async (
  prisma: PrismaClient,
  evaluationId: string,
) => {
  const evaluationToQuestions = await prisma.evaluationToQuestion.findMany({
    where: {
      evaluationId: evaluationId,
    },
    include: {
      question: {
        select: {
          ...SELECT_FOR_QUESTION_COPY,
          groupId: true,
        },
      },
    },
  })

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.evaluationToQuestion.deleteMany({
      where: { evaluationId: evaluationId },
    })

    for (const eToQ of evaluationToQuestions) {
      const newQuestion = await copyQuestion(prisma, eToQ.question.id, {
        source: QuestionSource.EVAL,
        prefix: '',
      })
      await tx.evaluationToQuestion.create({
        data: {
          points: eToQ.points,
          gradingPoints: eToQ.gradingPoints,
          order: eToQ.order,
          title: eToQ.title,
          evaluation: { connect: { id: evaluationId } },
          question: { connect: { id: newQuestion.id } },
        },
      })
    }
  })
}

type PatchBody = Pick<Prisma.EvaluationUpdateInput, 'phase'>

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
    select: {
      phase: true,
      startAt: true,
      endAt: true,
    },
  })

  if (!evaluation) {
    res.status(404).json({ message: 'Evaluation not found' })
    return
  }

  res.status(200).json(evaluation)
}

const patch = async (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: IApiContext,
) => {
  const { prisma } = ctx
  const { evaluationId } = req.query
  const body = req.body as PatchBody
  const { phase: nextPhase } = body

  if (!evaluationId || typeof evaluationId !== 'string') {
    res.status(400).json({ message: 'Invalid evaluationId' })
    return
  }

  if (!nextPhase) {
    res.status(400).json({ message: 'phase is required' })
    return
  }

  const currentEvaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    select: {
      phase: true,
      startAt: true,
      durationActive: true,
      durationHours: true,
      durationMins: true,
    },
  })

  if (!currentEvaluation) {
    res.status(404).json({ message: 'evaluation not found' })
    return
  }

  const data: Partial<Prisma.EvaluationUpdateInput> = { phase: nextPhase }

  if (nextPhase === EvaluationPhase.REGISTRATION) {
    await copyQuestionsForEvaluation(prisma, evaluationId)
  }

  if (nextPhase === EvaluationPhase.IN_PROGRESS) {
    data.startAt = new Date()

    // Update usage status for source questions of EVAL questions in this evaluation
    const sourceQuestionIds = await prisma.evaluationToQuestion
      .findMany({
        where: {
          evaluationId: evaluationId,
          question: {
            source: QuestionSource.EVAL,
            sourceQuestionId: { not: null },
          },
        },
        select: {
          question: { select: { sourceQuestionId: true } },
        },
      })
      .then((results) =>
        results
          .map((r) => r.question.sourceQuestionId)
          .filter((id): id is string => Boolean(id)),
      )

    if (sourceQuestionIds.length > 0) {
      await prisma.question.updateMany({
        where: {
          id: {
            in: sourceQuestionIds,
          },
        },
        data: {
          usageStatus: QuestionUsageStatus.USED,
          lastUsed: new Date(),
        },
      })
    }

    // optimistic endAt if duration active (read from DB only)
    const finalDurationActive = currentEvaluation.durationActive === true
    const hours = Number(currentEvaluation.durationHours ?? 0)
    const mins = Number(currentEvaluation.durationMins ?? 0)
    const deltaMs = computeDurationDeltaMs(finalDurationActive, hours, mins)
    if (deltaMs > 0) {
      const start = data.startAt as Date
      data.endAt = new Date(start.getTime() + deltaMs)
    }
  }

  if (
    currentEvaluation.phase === EvaluationPhase.IN_PROGRESS &&
    nextPhase === EvaluationPhase.GRADING
  ) {
    data.endAt = new Date()
  }

  const evaluation = await prisma.evaluation.update({
    where: { id: evaluationId },
    data,
  })

  res.status(200).json(evaluation)
}

export default withApiContext({
  GET: withGroupScope(
    withAuthorization(get, {
      roles: [Role.PROFESSOR, Role.STUDENT],
    }),
  ),
  PATCH: withGroupScope(withAuthorization(patch, { roles: [Role.PROFESSOR] })),
})
