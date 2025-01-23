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
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import LoadingAnimation from '../../feedback/LoadingAnimation'
import { studentPhaseRedirect } from '../../../code/phase'

/*
 *    Used as entry point for students
 *    Sends a join request to the server and redirects to the waiting page
 *  */
const PageJoin = () => {
  const router = useRouter()
  const { evaluationId } = router.query

  const { data: session, status } = useSession()
  const [error, setError] = useState(null)

  useEffect(() => {
    /*
     * users is joining the evaluation (it must be in draft or in-progress phase)
     * */
    setError(null)
    if (evaluationId && session && status === 'authenticated') {
      ;(async () => {
        await fetch(`/api/users/evaluations/${evaluationId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            studentEmail: session.user.email,
          }),
        })
          .then(async (res) => {
            let data
            try {
              data = await res.json()
            } catch (e) {
              data.message = 'Server error'
            }
            if (!res.ok) {
              throw new Error(data.message)
            }
            return data
          })
          .then(async (data) => {
            setError(null)
            const phase = data?.evaluation.phase
            ;(async () => {
              studentPhaseRedirect(evaluationId, phase, router)
            })()
          })
          .catch((err) => {
            setError(err.message)
          })
      })()
    }
  }, [evaluationId, router, session, status])

  return <LoadingAnimation content={error || 'joining...'} failed={error} />
}

export default PageJoin
