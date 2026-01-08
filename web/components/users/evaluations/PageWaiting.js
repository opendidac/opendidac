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

import { useRouter } from 'next/router'
import useSWR from 'swr'
import Authorization from '../../security/Authorization'
import { EvaluationPhase, Role } from '@prisma/client'
import Loading from '../../feedback/Loading'
import StudentPhaseRedirect from './StudentPhaseRedirect'
import LoadingAnimation from '../../feedback/LoadingAnimation'
import { Button, Typography } from '@mui/material'
import { fetcher } from '../../../core/utils'
import { signOut } from 'next-auth/react'

const phaseToPhrase = (phase) => {
  switch (phase) {
    case EvaluationPhase.NEW:
    case EvaluationPhase.COMPOSITION:
    case EvaluationPhase.REGISTRATION:
      return 'not in progress'
    case EvaluationPhase.IN_PROGRESS:
      return 'in progress'
    case EvaluationPhase.GRADING:
      return 'being graded'
    case EvaluationPhase.FINISHED:
      return 'finished'
    default:
      return 'unknown'
  }
}

const PageWaiting = () => {
  const router = useRouter()
  const evaluationId = router.query.evaluationId

  const { data, error } = useSWR(
    `/api/users/evaluations/${evaluationId}/dispatch`,
    evaluationId ? fetcher : null,
    { refreshInterval: 1000 },
  )

  return (
    <Authorization allowRoles={[Role.PROFESSOR, Role.STUDENT]}>
      <Loading errors={[error]} loading={!data}>
        {data?.evaluation && (
          <StudentPhaseRedirect phase={data.evaluation.phase}>
            {data.evaluation.phase !== EvaluationPhase.IN_PROGRESS && (
              <LoadingAnimation
                content={
                  <>
                    <Typography variant="body1" gutterBottom>
                      {data.evaluation.label
                        ? `${data.evaluation.label} is ${phaseToPhrase(
                            data.evaluation.phase,
                          )}.`
                        : 'This evaluation is not in progress.'}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {data.evaluation.phase === EvaluationPhase.GRADING
                        ? 'Please wait until the professor finishes grading.'
                        : 'Please wait until the professor starts the evaluation.'}
                    </Typography>
                    <Button onClick={() => signOut()}>Sign out</Button>
                  </>
                }
              />
            )}
          </StudentPhaseRedirect>
        )}
      </Loading>
    </Authorization>
  )
}

export default PageWaiting
