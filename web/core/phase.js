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

export const phaseGT = (a, b) => {
  return (
    Object.keys(EvaluationPhase).indexOf(a) >
    Object.keys(EvaluationPhase).indexOf(b)
  )
}

export const phasePageRelationship = {
  NEW: ['/users/evaluations/[evaluationId]/wait'],
  COMPOSITION: ['/users/evaluations/[evaluationId]/wait'],
  REGISTRATION: ['/users/evaluations/[evaluationId]/wait'],
  IN_PROGRESS: [
    '/users/evaluations/[evaluationId]/take',
    '/users/evaluations/[evaluationId]/take/[pageIndex]',
  ],
  GRADING: ['/users/evaluations/[evaluationId]/wait'],
  FINISHED: ['/users/evaluations/[evaluationId]/consult/[questionPage]'],
}

export const studentPhaseRedirect = async (evaluationId, phase, router) => {
  // this redirect supposes the users is already connected to the evaluation
  // dispatch phase is handling the redirection for the users to connect to the evaluation
  switch (phase) {
    case EvaluationPhase.NEW:
    case EvaluationPhase.COMPOSITION:
    case EvaluationPhase.REGISTRATION:
    case EvaluationPhase.GRADING:
      await router.push(`/users/evaluations/${evaluationId}/wait`)
      return
    case EvaluationPhase.IN_PROGRESS:
      await router.push(`/users/evaluations/${evaluationId}/take`)
      return
    case EvaluationPhase.FINISHED:
      await router.push(`/users/evaluations/${evaluationId}/consult/1`)
      return
  }
}

export const isJoinable = (phase) => {
  return (
    phaseGT(phase, EvaluationPhase.COMPOSITION) &&
    !phaseGT(phase, EvaluationPhase.IN_PROGRESS)
  )
}
