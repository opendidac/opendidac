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

import { Role, QuestionStatus, EvaluationPhase } from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withMethodHandler } from '@/middleware/withMethodHandler'
import { withPrisma } from '@/middleware/withPrisma'

const archive = async (ctx, args) => {
  const { req, res, prisma } = ctx
  const { questionId } = req.query
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  })

  if (!question) {
    res.status(404).json({ message: 'Question not found' })
    return
  }

  if (question.status !== QuestionStatus.ACTIVE) {
    res.status(400).json({ message: 'Question is already archived' })
    return
  }

  // Find evaluations in composition phase that contain this question
  const evaluations = await prisma.evaluation.findMany({
    where: {
      evaluationToQuestions: {
        some: {
          questionId: questionId,
        },
      },
      phase: {
        in: [
          EvaluationPhase.NEW,
          EvaluationPhase.SETTINGS,
          EvaluationPhase.COMPOSITION,
        ],
      },
    },
    include: {
      evaluationToQuestions: true,
    },
  })

  let archivedQuestion = undefined
  await prisma.$transaction(async (prisma) => {
    // Remove from evaluations in composition phase and update orders
    for (const evaluation of evaluations) {
      const evaluationToQuestions = evaluation.evaluationToQuestions.filter(
        (etq) =>
          etq.order >
          evaluation.evaluationToQuestions.find(
            (etq) => etq.questionId === questionId,
          ).order,
      )
      for (const etq of evaluationToQuestions) {
        await prisma.evaluationToQuestion.update({
          where: {
            evaluationId_questionId: {
              evaluationId: etq.evaluationId,
              questionId: etq.questionId,
            },
          },
          data: {
            order: etq.order - 1,
          },
        })
      }
    }

    // Remove from evaluations in allowed phases
    await prisma.evaluationToQuestion.deleteMany({
      where: {
        questionId,
        evaluation: {
          phase: {
            in: [
              EvaluationPhase.NEW,
              EvaluationPhase.SETTINGS,
              EvaluationPhase.COMPOSITION,
            ],
          },
        },
      },
    })

    // Archive the question
    archivedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        status: QuestionStatus.ARCHIVED,
      },
    })
  })

  res.status(200).json(archivedQuestion)
}

export default withMethodHandler({
  POST: withGroupScope(
    withAuthorization(withPrisma(archive), { roles: [Role.PROFESSOR] }),
  ),
})
