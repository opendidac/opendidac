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

import { Role, Prisma } from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import type { IApiContext } from '@/types/api'
import { withPurgeGuard } from '@/middleware/withPurged'
import { withEvaluation } from '@/middleware/withEvaluation'
import {
  mergeSelects,
  selectBase,
  selectQuestionTags,
  selectTypeSpecific,
  selectAllStudentAnswers,
  selectStudentGradings,
} from '@/code/question/select'

/**
 * Select clause for professor tracking progress during evaluation
 * Includes: type-specific, ALL user answers, gradings, professor-only info
 * Note: Does NOT include official answers (not necessary for tracking progress)
 */
const selectForProfessorProgressTracking = (): Prisma.QuestionSelect => {
  return mergeSelects(
    selectBase({ includeProfessorOnlyInfo: true }),
    selectQuestionTags(),
    selectTypeSpecific(),
    selectAllStudentAnswers(),
    selectStudentGradings(),
  )
}

interface PatchBody {
  action: 'reduce' | 'extend'
  amountMinutes: number
}

const get = async (ctx: IApiContext) => {
  const { req, res, prisma } = ctx
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
      evaluationToQuestions: {
        select: {
          question: {
            select: selectForProfessorProgressTracking(),
          },
          order: true,
          points: true,
          gradingPoints: true,
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

const patch = async (ctx: IApiContext) => {
  const { req, res, prisma } = ctx
  const { evaluationId } = req.query
  const body = req.body as PatchBody
  const { action, amountMinutes } = body

  if (!evaluationId || typeof evaluationId !== 'string') {
    res.status(400).json({ message: 'Invalid evaluationId' })
    return
  }

  const allowedActions = ['reduce', 'extend']
  if (!allowedActions.includes(action)) {
    res.status(400).json({ message: 'Invalid action' })
    return
  }
  const minutes = Number(amountMinutes)
  if (!Number.isFinite(minutes) || minutes <= 0) {
    res.status(400).json({ message: 'amountMinutes must be a positive number' })
    return
  }

  const current = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    select: {
      phase: true,
      durationActive: true,
      endAt: true,
    },
  })

  if (!current) {
    res.status(404).json({ message: 'evaluation not found' })
    return
  }

  if (current.phase !== 'IN_PROGRESS') {
    res
      .status(400)
      .json({ message: 'Duration can only be adjusted in IN_PROGRESS phase' })
    return
  }
  if (!current.durationActive) {
    res.status(400).json({
      message: 'Duration adjustments require durationActive to be enabled',
    })
    return
  }
  if (!current.endAt) {
    res.status(400).json({ message: 'endAt is not set yet' })
    return
  }

  const deltaMs = minutes * 60 * 1000
  const signedDelta = action === 'reduce' ? -deltaMs : deltaMs
  const newEndAt = new Date(new Date(current.endAt).getTime() + signedDelta)

  const updated = await prisma.evaluation.update({
    where: { id: evaluationId },
    data: { endAt: newEndAt },
  })

  res.status(200).json(updated)
}

export default withApiContext({
  GET: withGroupScope(
    withEvaluation(
      withAuthorization(withPurgeGuard(get), {
        roles: [Role.PROFESSOR],
      }),
    ),
  ),
  PATCH: withGroupScope(withAuthorization(patch, { roles: [Role.PROFESSOR] })),
})
