/**
 * Copyright 2022-2024 HEIG-VD
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

import { Role, Prisma } from '@prisma/client'
import { withAuthorization } from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import type { IApiContext, IApiContextWithEvaluation } from '@/types/api'
import { withRestrictions } from '@/middleware/withRestrictions'
import { withEvaluation } from '@/middleware/withEvaluation'
import { withPurgeGuard } from '@/middleware/withPurged'

import { getUser } from '@/code/auth/auth'

import {
  SELECT_BASE,
  SELECT_QUESTION_TAGS,
  SELECT_TYPE_SPECIFIC,
  SELECT_OFFICIAL_ANSWERS,
} from '@/code/question/select'

import { SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING } from '@/code/question/select/modules/studentAnswers'

import { isFinished } from './questions/[questionId]/answers/utils'
/**
 * Pure literal used for student consultation BEFORE applying per-user filters.
 * Perfect deep inference. No parameters.
 */
export const SELECT_FOR_STUDENT_CONSULTATION = {
  ...SELECT_BASE,
  ...SELECT_TYPE_SPECIFIC,
  ...SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING,
  ...SELECT_QUESTION_TAGS,
} as const satisfies Prisma.QuestionSelect

/**
 * Builds final select for student consultation.
 * - Starts from PURE literal
 * - Adds dynamic per-user filter inline
 * - Optionally adds official answers
 */
const buildSelectForStudentConsultation = (
  userEmail: string,
  includeOfficial: boolean,
): Prisma.QuestionSelect => {
  // Add dynamic filter directly here
  const withFilter: Prisma.QuestionSelect = {
    ...SELECT_FOR_STUDENT_CONSULTATION,
    studentAnswer: {
      ...SELECT_FOR_STUDENT_CONSULTATION.studentAnswer,
      where: { userEmail },
    },
  }

  return {
    ...withFilter,
    ...(includeOfficial ? SELECT_OFFICIAL_ANSWERS : {}),
  } as const satisfies Prisma.QuestionSelect
}

const get = async (ctx: IApiContextWithEvaluation | IApiContext) => {
  const { req, res, prisma } = ctx
  const { evaluationId } = req.query

  if (!evaluationId || typeof evaluationId !== 'string') {
    res.status(400).json({ message: 'Invalid evaluationId' })
    return
  }

  if (!('evaluation' in ctx)) {
    res.status(500).json({ message: 'Evaluation not found in context' })
    return
  }

  const { evaluation } = ctx

  const user = await getUser(req, res)
  if (!user?.email) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const email = user.email

  if (!(await isFinished(evaluationId, prisma))) {
    res.status(400).json({ message: 'Exam session is not finished' })
    return
  }

  if (!evaluation.consultationEnabled) {
    res.status(403).json({
      message: 'Consultation is disabled for this evaluation.',
    })
    return
  }

  const userOnEvaluation = await prisma.userOnEvaluation.findUnique({
    where: {
      userEmail_evaluationId: {
        userEmail: email,
        evaluationId,
      },
    },
    include: {
      evaluation: {
        select: {
          showSolutionsWhenFinished: true,
          evaluationToQuestions: {
            select: {
              points: true,
              order: true,
              addendum: true,
              title: true,
              question: {
                select: buildSelectForStudentConsultation(
                  email,
                  evaluation.showSolutionsWhenFinished,
                ),
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  })

  if (!userOnEvaluation) {
    res.status(403).json({
      message: 'You are not allowed to access this evaluation',
    })
    return
  }

  res.status(200).json(userOnEvaluation.evaluation)
}

export default withApiContext({
  GET: withEvaluation(
    withRestrictions(
      withAuthorization(withPurgeGuard(get), {
        roles: [Role.PROFESSOR, Role.STUDENT],
      }),
    ) as any,
  ),
})
