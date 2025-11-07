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

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { fetcher } from '../code/utils'
import useSWR from 'swr'
import { useRouter } from 'next/router'
import {
  EvaluationPhase,
  StudentAnswerStatus,
  UserOnEvaluationStatus,
} from '@prisma/client'
import { Stack, Typography } from '@mui/material'
import StudentPhaseRedirect from '@/components/users/evaluations/StudentPhaseRedirect'
import ConsoleLog from '@/components/layout/utils/ConsoleLog'
import {
  EvaluationCompletedDialog,
  EvaluationRestrictionGuard,
} from '@/components/users/evaluations/security/EvaluationRestrictionGuard'

const getFilledStatus = (studentAnswerStatus) => {
  switch (studentAnswerStatus) {
    case StudentAnswerStatus.MISSING:
      return 'empty'
    case StudentAnswerStatus.IN_PROGRESS:
      return 'half'
    case StudentAnswerStatus.SUBMITTED:
      return 'filled'
    default:
      return 'empty'
  }
}

const StudentOnEvaluationContext = createContext()

export const useStudentOnEvaluation = () =>
  useContext(StudentOnEvaluationContext)

export const StudentOnEvaluationProvider = ({ children }) => {
  const router = useRouter()

  const { evaluationId, pageIndex } = router.query

  const {
    data: evaluation,
    error: errorEvaluationStatus,
    mutate,
  } = useSWR(
    `/api/users/evaluations/${evaluationId}/status`,
    evaluationId ? fetcher : null,
    {
      refreshInterval: 1000,
      revalidateOnFocus: true,
      onError: (err) => console.error('Error fetching evaluation status:', err),
    },
  )

  const hasStudentFinished = useCallback(
    () =>
      evaluation?.userOnEvaluation?.status === UserOnEvaluationStatus.FINISHED,
    [evaluation],
  )

  const shouldFetchQuestions = useCallback(
    () =>
      evaluation?.evaluation?.phase === EvaluationPhase.IN_PROGRESS &&
      !hasStudentFinished() &&
      !errorEvaluationStatus, // Don't fetch if /status has an error
    [evaluation?.evaluation?.phase, hasStudentFinished, errorEvaluationStatus],
  )

  // Only fetch /take endpoint when we need questions and /status succeeded
  // The /status endpoint also uses withRestrictions, so it will catch restriction errors
  const {
    data: evaluationToQuestions,
    error: errorUserOnEvaluation,
    mutate: mutateUserOnEvaluation,
  } = useSWR(
    `/api/users/evaluations/${evaluationId}/take`,
    shouldFetchQuestions() ? fetcher : null,
    {
      revalidateOnFocus: true,
      onError: (err) =>
        console.error('Error fetching evaluation questions:', err),
    },
  )

  // Use the data from /take when available
  const validEvaluationToQuestions = evaluationToQuestions

  /*
  evaluationToQuestions: 
  - contains the list of questions linked to the evaluation
  - the order and points are in the relation between evaluation and question
  - The question returned is shallow (no type specific data)
    - Used for paging, navigation and problem statement (with points)
    - It also contains the status of the student answer (missing, in progress, submitted) used in paging and home page
  */
  const activeQuestion =
    validEvaluationToQuestions && validEvaluationToQuestions[pageIndex - 1]

  // Check both /status and /take errors for restriction errors
  // /status uses withRestrictions, so it will catch restriction errors
  // /take also uses withRestrictions and may have additional errors
  const error = errorEvaluationStatus || errorUserOnEvaluation

  // States
  const [loaded, setLoaded] = useState(false)
  const [page, setPage] = useState(parseInt(pageIndex))
  const [pages, setPages] = useState([])

  useEffect(() => {
    if (validEvaluationToQuestions) {
      const pages = validEvaluationToQuestions.map((jtq) => ({
        id: jtq.question.id,
        label: (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <span>{`Q${jtq.order + 1}`}</span>
            <Typography
              variant="caption"
              sx={{ textTransform: 'none' }}
            >{`(${jtq.points} pts)`}</Typography>
          </Stack>
        ),
        tooltip: `${jtq.question.type} "${jtq.title}" - ${jtq.points} points`,
        fillable: true,
        state: getFilledStatus(jtq.question.studentAnswer[0].status),
      }))
      setPages(pages)
      setLoaded(true)
    }
  }, [validEvaluationToQuestions])

  useEffect(() => {
    setPage(parseInt(pageIndex))
  }, [pageIndex])

  useEffect(() => {
    mutateUserOnEvaluation()
  }, [evaluation?.userOnEvaluation?.status, mutateUserOnEvaluation])

  const submitAnswerToggle = useCallback(
    (questionId, isSubmitting) => {
      if (!validEvaluationToQuestions) return

      // it is important to find the appropriate index rather than using the pageIndex
      // The student might move to another question before the callback is called in case of high latency
      const index = validEvaluationToQuestions.findIndex(
        (jtq) => jtq.question.id === questionId,
      )
      if (index !== -1) {
        setPages((prevPages) => {
          const newPages = [...prevPages]
          newPages[index].state = isSubmitting ? 'filled' : 'half'
          return newPages
        })
      }

      const jstq = validEvaluationToQuestions.find(
        (jtq) => jtq.question.id === questionId,
      )
      if (jstq) {
        jstq.question.studentAnswer[0].status = isSubmitting
          ? StudentAnswerStatus.SUBMITTED
          : StudentAnswerStatus.IN_PROGRESS
      }
    },
    [validEvaluationToQuestions],
  )

  const submitAnswer = useCallback(
    (questionId) => {
      submitAnswerToggle(questionId, true)
    },
    [submitAnswerToggle],
  )

  const unsubmitAnswer = useCallback(
    (questionId) => {
      submitAnswerToggle(questionId, false)
    },
    [submitAnswerToggle],
  )

  const changeAnswer = useCallback(
    (questionId, updatedStudentAnswer) => {
      if (!validEvaluationToQuestions) return

      const jstq = validEvaluationToQuestions.find(
        (jtq) => jtq.question.id === questionId,
      )
      if (jstq) {
        jstq.question.studentAnswer[0] = updatedStudentAnswer
        // it is important to find the appropriate index rather than using the pageIndex
        // The student might move to another question before the callback is called in case of high latency
        const index = validEvaluationToQuestions.findIndex(
          (jtq) => jtq.question.id === questionId,
        )
        if (index !== -1) {
          setPages((prevPages) => {
            const newPages = [...prevPages]
            newPages[index].state = getFilledStatus(updatedStudentAnswer.status)
            return newPages
          })
        }
      }
    },
    [validEvaluationToQuestions],
  )

  return (
    <StudentOnEvaluationContext.Provider
      value={{
        evaluationId,
        evaluation: evaluation?.evaluation,
        evaluationToQuestions: validEvaluationToQuestions,
        activeQuestion,
        loaded,
        error,
        pages,
        page,
        submitAnswer,
        unsubmitAnswer,
        changeAnswer,
        mutate,
      }}
    >
      <EvaluationRestrictionGuard error={error} evaluationId={evaluationId}>
        <StudentPhaseRedirect phase={evaluation?.evaluation?.phase}>
          <ConsoleLog>test</ConsoleLog>
          {hasStudentFinished() ? <EvaluationCompletedDialog /> : children}
        </StudentPhaseRedirect>
      </EvaluationRestrictionGuard>
    </StudentOnEvaluationContext.Provider>
  )
}
