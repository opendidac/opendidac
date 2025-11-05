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
  Role,
  UserOnEvaluationAccessMode,
  QuestionSource,
  EvaluationPhase,
} from '@prisma/client'
import { withPrisma } from '@/middleware/withPrisma'
import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { phaseGT } from '@/code/phase'

const get = async (req, res, prisma) => {
  const { evaluationId } = req.query

  const evaluation = await prisma.evaluation.findUnique({
    where: {
      id: evaluationId,
    },
    include: {
      purgedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      archivedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  res.status(200).json(evaluation)
}

const patch = async (req, res, prisma) => {
  const { evaluationId } = req.query

  const currentEvaluation = await prisma.evaluation.findUnique({
    where: {
      id: evaluationId,
    },
    select: {
      phase: true,
      startAt: true,
      durationActive: true,
      durationHours: true,
      durationMins: true,
      accessMode: true,
    },
  })

  if (!currentEvaluation) {
    res.status(404).json({ message: 'evaluation not found' })
    return
  }

  const {
    label,
    conditions,
    durationActive,
    durationHours,
    durationMins,
    action,
    amountMinutes,

    status,
    consultationEnabled,
    showSolutionsWhenFinished,
    accessMode,
    accessList,
    ipRestrictions,
  } = req.body

  let data = {}

  // Dedicated handler for duration adjustments from In-Progress page
  if (action) {
    const allowedActions = ['reduce', 'extend']
    if (!allowedActions.includes(action)) {
      res.status(400).json({ message: 'Invalid action' })
      return
    }
    const minutes = Number(amountMinutes)
    if (!Number.isFinite(minutes) || minutes <= 0) {
      res
        .status(400)
        .json({ message: 'amountMinutes must be a positive number' })
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
    return
  }

  // Reject phase changes here; use /phase endpoint instead
  if (req.body?.phase) {
    res
      .status(400)
      .json({ message: 'Phase changes must be done via the /phase endpoint.' })
    return
  }

  if (label !== undefined) {
    data.label = label
  }

  if (conditions !== undefined) {
    data.conditions = conditions
  }

  if (status !== undefined) {
    data.status = status
  }

  // Duration settings can change while IN_PROGRESS. Persist updates and
  // recompute optimistic endAt when applicable.
  const didReceiveDurationFields =
    durationActive !== undefined ||
    durationHours !== undefined ||
    durationMins !== undefined

  if (didReceiveDurationFields) {
    if (durationActive !== undefined) data.durationActive = durationActive
    if (durationHours !== undefined) data.durationHours = durationHours
    if (durationMins !== undefined) data.durationMins = durationMins

    // Duration can be changed in any phase up to and including IN_PROGRESS.
    // If startAt exists, recompute optimistic endAt using final duration settings.
    const isAfterInProgress = phaseGT(
      currentEvaluation.phase,
      EvaluationPhase.IN_PROGRESS,
    )

    if (!isAfterInProgress) {
      const finalActive =
        (durationActive ?? currentEvaluation.durationActive) === true
      const finalHours = Number(
        durationHours ?? currentEvaluation.durationHours ?? 0,
      )
      const finalMins = Number(
        durationMins ?? currentEvaluation.durationMins ?? 0,
      )
      const totalMs = (finalHours * 60 + finalMins) * 60 * 1000
      if (finalActive && totalMs > 0 && currentEvaluation.startAt) {
        const startDate = new Date(currentEvaluation.startAt)
        data.endAt = new Date(startDate.getTime() + totalMs)
      }
      // If finalActive is false or duration is zero, we leave endAt untouched
      // to avoid unexpectedly clearing the countdown.
    }
  }

  // endAt is automatically managed during phase transitions
  // Manual setting of endAt is not allowed

  // Handle consultation and solutions conflict resolution
  if (consultationEnabled !== undefined) {
    data.consultationEnabled = consultationEnabled

    // If consultation is disabled, also disable showing solutions
    if (!consultationEnabled) {
      data.showSolutionsWhenFinished = false
    } else if (showSolutionsWhenFinished !== undefined) {
      // If consultation is enabled, respect the showSolutionsWhenFinished value
      data.showSolutionsWhenFinished = showSolutionsWhenFinished
    }
  } else if (showSolutionsWhenFinished !== undefined) {
    // Only update showSolutionsWhenFinished if consultation is enabled
    if (currentEvaluation.consultationEnabled) {
      data.showSolutionsWhenFinished = showSolutionsWhenFinished
    }
  }

  if (ipRestrictions !== undefined) {
    data.ipRestrictions = ipRestrictions
  }

  if (accessMode !== undefined) {
    data.accessMode = accessMode
  }

  if (accessList !== undefined) {
    data.accessList = accessList
  }

  let evaluationAfterUpdate = undefined
  await prisma.$transaction(async (prisma) => {
    evaluationAfterUpdate = await prisma.evaluation.update({
      where: {
        id: evaluationId,
      },
      data: data,
    })

    if (
      currentEvaluation.accessMode ===
      UserOnEvaluationAccessMode.LINK_AND_ACCESS_LIST
    ) {
      // remove eventual denied students
      await prisma.userOnEvaluationDeniedAccessAttempt.deleteMany({
        where: {
          evaluationId: evaluationId,
          userEmail: {
            in: accessList || [],
          },
        },
      })
    }
  })

  res.status(200).json(evaluationAfterUpdate)
}

const del = async (req, res, prisma) => {
  const { groupScope, evaluationId } = req.query

  /*
        get all the questions related to this evaluation
        It is not possible to cascade delete the questions because we passed bv and an intermediate relation
     */
  const jstqs = await prisma.evaluationToQuestion.findMany({
    where: {
      evaluationId: evaluationId,
    },
  })

  const questionIds = jstqs.map((jstq) => jstq.questionId)

  await prisma.$transaction(async (prisma) => {
    // delete all the questions related to this evaluation
    await prisma.question.deleteMany({
      where: {
        id: {
          in: questionIds,
        },
        source: {
          not: QuestionSource.BANK,
        },
        group: {
          scope: groupScope,
        },
      },
    })
    await prisma.evaluation.delete({
      where: {
        id: evaluationId,
      },
    })
  })

  res.status(200).json({ message: 'evaluation deleted' })
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    PATCH: withAuthorization(withPrisma(patch), [Role.PROFESSOR]),
    DELETE: withAuthorization(withPrisma(del), [Role.PROFESSOR]),
  }),
)
