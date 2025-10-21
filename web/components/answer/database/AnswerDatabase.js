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
import useSWR from 'swr'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Button, Stack } from '@mui/material'
import { LoadingButton } from '@mui/lab'

import { fetcher } from '@/code/utils'
import Loading from '@/components/feedback/Loading'
import BottomCollapsiblePanel from '@/components/layout/utils/BottomCollapsiblePanel'
import ScrollContainer from '@/components/layout/ScrollContainer'

import QueriesRunSummary from './QueriesRunSummary'
import StudentQueryEditor from './StudentQueryEditor'
import StudentOutputDisplay from './StudentOutputDisplay'
import StudentQueryConsole from './StudentQueryConsole'
import BottomPanelHeader from '@/components/layout/utils/BottomPanelHeader'

const AnswerDatabase = ({ evaluationId, question, onAnswerChange }) => {
  const { data: questionAnswer, error } = useSWR(
    `/api/users/evaluations/${evaluationId}/questions/${question.id}/answers`,
    question?.id ? fetcher : null,
    { revalidateOnFocus: false },
  )

  const studentAnswer = questionAnswer?.studentAnswer
  const questionId = question?.id

  const ref = useRef()

  const [saveLock, setSaveLock] = useState(false)
  const [saving, setSaving] = useState(false)
  const [openConsole, setOpenConsole] = useState(false)
  const [queries, setQueries] = useState()
  const [studentOutputs, setStudentOutputs] = useState()

  useEffect(() => {
    const studentQueries = studentAnswer?.database?.queries
    if (studentQueries) {
      setQueries(studentQueries.map((q) => q.query))
      setStudentOutputs(studentQueries.map((q) => q.studentOutput))
    }
  }, [questionId, studentAnswer])

  const solutionOutputs = useMemo(
    () =>
      question?.database.solutionQueries.map((solQ) => ({
        order: solQ.query.order,
        output: solQ.output?.output,
      })),
    [question],
  )

  const getSolutionOutput = useCallback(
    (order) => solutionOutputs.find((q) => q.order === order),
    [solutionOutputs],
  )

  const saveAndTest = useCallback(async () => {
    setSaving(true)

    setStudentOutputs(
      queries.map((q, index) => ({
        ...studentOutputs[index],
        output: {
          ...studentOutputs[index]?.output,
          result: null,
          status: 'RUNNING',
          testPassed: null,
        },
      })) || [],
    )

    // remove any lintResult from queries
    setQueries(
      queries.map((q) => ({
        ...q,
        lintResult: null,
      })) || [],
    )

    const studentAnswerQueries = await fetch(
      `/api/sandbox/evaluations/${evaluationId}/questions/${questionId}/student/database`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    ).then((res) => res.json())

    setStudentOutputs(studentAnswerQueries.map((q) => q.studentOutput))
    setQueries(
      queries.map((q, index) => ({
        ...q,
        lintResult: studentAnswerQueries[index].query.lintResult,
      })) || [],
    )
    setSaving(false)
  }, [evaluationId, questionId, queries, studentOutputs])

  const onQueryChange = useCallback(
    async (query) => {
      const response = await fetch(
        `/api/users/evaluations/${evaluationId}/questions/${questionId}/answers/database/${query.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: query.content }),
        },
      )

      const ok = response.ok
      const data = await response.json()

      setSaveLock(false)
      onAnswerChange && onAnswerChange(ok, data)
    },
    [evaluationId, questionId, onAnswerChange],
  )

  const debouncedOnChange = useDebouncedCallback(onQueryChange, 500)

  const handleChange = useCallback(
    (query) => {
      // Update in memory for re-render
      const index_of = queries.findIndex((q) => q.order === query.order)
      queries[index_of] = query
      setSaveLock(true)
      debouncedOnChange(query)
    },
    [queries, debouncedOnChange],
  )

  return (
    <Loading errors={[error]} loading={!studentAnswer}>
      {queries && queries.length > 0 && (
        <>
          <BottomCollapsiblePanel
            bottomPanel={
              <BottomToolbar
                saving={saving}
                saveLock={saveLock}
                saveAndTest={saveAndTest}
                openConsole={() => setOpenConsole(true)}
              />
            }
          >
            <Stack pt={1}>
              <QueriesRunSummary
                queries={queries}
                studentOutputs={studentOutputs}
              />
            </Stack>
            <ScrollContainer ref={ref} pb={24}>
              {queries?.map((query, index) => (
                <Stack key={query.id}>
                  <StudentQueryEditor
                    query={query}
                    onChange={(query) => handleChange(query)}
                  />
                  <StudentOutputDisplay
                    order={query.order}
                    testQuery={query.testQuery}
                    queryOutputTests={query.queryOutputTests}
                    lintResult={query.lintResult}
                    studentOutput={studentOutputs[index]}
                    solutionOutput={getSolutionOutput(query.order)}
                  />
                </Stack>
              ))}
            </ScrollContainer>
          </BottomCollapsiblePanel>
          <StudentQueryConsole
            evaluationId={evaluationId}
            questionId={questionId}
            open={openConsole}
            studentQueries={queries}
            onClose={() => setOpenConsole(false)}
          />
        </>
      )}
    </Loading>
  )
}

const BottomToolbar = ({ saving, saveLock, saveAndTest, openConsole }) => (
  <BottomPanelHeader>
    <Stack direction="row" spacing={1}>
      <LoadingButton
        loading={saving}
        disabled={saveLock}
        variant={'contained'}
        onClick={() => saveAndTest()}
        size="small"
      >
        Save and test
      </LoadingButton>

      <Button variant={'outlined'} onClick={() => openConsole()} size="small">
        Console
      </Button>
    </Stack>
  </BottomPanelHeader>
)

export default AnswerDatabase
