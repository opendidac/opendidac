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

import { Role } from '@prisma/client'
import { useRouter } from 'next/router'
import Authentication from '../../security/Authentication'
import Authorization from '../../security/Authorization'
import useSWR from 'swr'
import { useEffect } from 'react'
import { studentPhaseRedirect } from '../../../core/phase'
import { fetcher } from '../../../core/utils'
import Loading from '../../feedback/Loading'
import { EvaluationRestrictionGuard } from '@/components/users/evaluations/security/EvaluationRestrictionGuard'

const PageDispatch = () => {
  const router = useRouter()
  const { evaluationId } = router.query

  const { data, error: dispatchError } = useSWR(
    `/api/users/evaluations/${evaluationId}/dispatch`,
    evaluationId ? fetcher : null,
    {
      refreshInterval: 1000,
    },
  )

  useEffect(() => {
    if (data && !dispatchError) {
      const { evaluation, userOnEvaluation } = data

      if (!userOnEvaluation) {
        // User is not on the evaluation - redirect to join
        // Let the join API handle all validation (phase, access list, etc.)
        ;(async () => {
          await router.push(`/users/evaluations/${evaluationId}/join`)
        })()
      } else {
        // User is already on the evaluation - redirect based on phase
        ;(async () => {
          await studentPhaseRedirect(evaluationId, evaluation.phase, router)
        })()
      }
    }
  }, [evaluationId, router, data, dispatchError])

  return (
    <Authentication>
      <Authorization allowRoles={[Role.STUDENT, Role.PROFESSOR]}>
        <EvaluationRestrictionGuard
          error={dispatchError}
          evaluationId={evaluationId}
        >
          <Loading errors={[dispatchError].filter(Boolean)} loading={!data} />
        </EvaluationRestrictionGuard>
      </Authorization>
    </Authentication>
  )
}

export default PageDispatch
