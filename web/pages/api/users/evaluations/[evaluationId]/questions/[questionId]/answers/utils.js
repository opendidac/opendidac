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
import { EvaluationPhase } from '@prisma/client'

const selectEvaluation = async (evaluationId, prisma) => {
  if (!evaluationId) return null
  return await prisma.evaluation.findUnique({
    where: {
      id: evaluationId,
    },
    select: {
      phase: true,
    },
  })
}

export const isInProgress = async (evaluationId, prisma) => {
  // get the questions collections session phase
  if (!evaluationId) return false

  const evaluation = await selectEvaluation(evaluationId, prisma)
  return evaluation?.phase === EvaluationPhase.IN_PROGRESS
}

export const isFinished = async (evaluationId, prisma) => {
  // get the questions collections session phase
  if (!evaluationId) return false
  const evaluation = await selectEvaluation(evaluationId, prisma)
  return evaluation?.phase === EvaluationPhase.FINISHED
}
