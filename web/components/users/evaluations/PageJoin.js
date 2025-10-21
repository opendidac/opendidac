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
import { useCallback, useEffect, useState } from 'react'
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
  const [isRetrying, setIsRetrying] = useState(false)

  const attemptJoin = useCallback(async () => {
    if (!evaluationId || !session || status !== 'authenticated') {
      return
    }

    try {
      const res = await fetch(`/api/users/evaluations/${evaluationId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          studentEmail: session.user.email,
        }),
      })

      let data
      try {
        data = await res.json()
      } catch (e) {
        data = { message: 'Server error' }
      }

      if (!res.ok) {
        // Always show the API response message for non-200 status
        setError(data.message)

        if (res.status !== 200) {
          // 400 errors are potentially retryable (phase not ready, etc.)
          setIsRetrying(true)
          setTimeout(() => {
            attemptJoin()
          }, 2000)
          return
        } else {
          // Other errors (401, 403, 404, 500, etc.) - don't retry
          setIsRetrying(false)
          return
        }
      }

      // Success - redirect to appropriate phase
      setError(null)
      setIsRetrying(false)
      const phase = data?.evaluation.phase
      await studentPhaseRedirect(evaluationId, phase, router)
    } catch (err) {
      setError(err.message)
      setIsRetrying(false)
    }
  }, [evaluationId, session, status, router])

  useEffect(() => {
    setError(null)
    setIsRetrying(false)
    attemptJoin()
  }, [attemptJoin])

  const displayMessage = error || 'Joining...'

  return (
    <LoadingAnimation content={displayMessage} failed={!isRetrying && error} />
  )
}

export default PageJoin
