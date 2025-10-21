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
import React, { useCallback } from 'react'
import { Alert, AlertTitle, Box, Stack, Typography } from '@mui/material'
import { DatabaseQueryOutputStatus } from '@prisma/client'

import { useResizeObserver } from '@/context/ResizeObserverContext'
import ScrollContainer from '@/components/layout/ScrollContainer'
import QueryEditor from '@/components/question/type_specific/database/QueryEditor'
import QueryOutput from '@/components/question/type_specific/database/QueryOutput'
import ResizePanel from '@/components/layout/utils/ResizePanel'

import QueriesRunSummary from './database/QueriesRunSummary'

const ConsultQuery = ({ header, query, output }) => {
  const hasTestPassed = (studentOutput) => {
    return studentOutput?.testPassed
  }

  const getTestColor = (studentOutput) => {
    if (!studentOutput) return 'info' // no users output yet -> we display solution output in blue
    const testPassed = hasTestPassed(studentOutput)
    if (testPassed === null) return 'info' // test is running -> we display users output in blue
    // test is finished, we display users output in success if test passed, warning if fail and error if query failed to run
    return testPassed
      ? 'success'
      : studentOutput.status === DatabaseQueryOutputStatus.ERROR
        ? 'error'
        : 'warning'
  }

  return (
    query && (
      <>
        <QueryEditor readOnly query={query} />
        {output && (
          <QueryOutput
            header={header}
            color={query.testQuery ? getTestColor(output) : 'info'}
            result={output}
            lintResult={query.lintResult}
          />
        )}
      </>
    )
  )
}

const CompareDatabase = ({ solution, answer }) => {
  const { height: containerHeight } = useResizeObserver()

  const allQueries = answer.queries
  const allTestQueries = answer.queries.filter((saQ) => saQ.query.testQuery)
  const passedTestQueries = allQueries.filter(
    (saQ) => saQ.studentOutput?.output.testPassed,
  )

  const allLintQueries = answer.queries.filter((saQ) => saQ.query.lintRules)
  const passedLintQueries = allLintQueries.filter(
    (saQ) => saQ.query.lintResult?.violations.length === 0,
  )

  const solutionQueries = solution.solutionQueries

  const getSolutionQuery = useCallback(
    (order) => {
      return solutionQueries.find((sq) => sq.query.order === order)
    },
    [solutionQueries],
  )

  return (
    answer &&
    solution && (
      <Stack
        maxHeight={containerHeight}
        height={'100%'}
        width={'100%'}
        maxWidth={'100%'}
      >
        <QueriesRunSummary
          queries={allQueries.map((saQ) => saQ.query)}
          studentOutputs={allQueries.map((saQ) => saQ.studentOutput)}
        />
        <Stack
          direction={'row'}
          spacing={1}
          width={'100%'}
          justifyContent={'stretch'}
        >
          <Box flex={1}>
            <Alert
              flex={1}
              severity={
                passedTestQueries.length === allTestQueries.length
                  ? 'success'
                  : 'warning'
              }
            >
              <AlertTitle>
                {passedTestQueries.length}/{allTestQueries.length} Output tests
                passed
              </AlertTitle>
            </Alert>
          </Box>
          <Box flex={1}>
            <Alert
              severity={
                passedLintQueries.length === allLintQueries.length
                  ? 'success'
                  : 'warning'
              }
            >
              <AlertTitle>
                {passedLintQueries.length}/{allLintQueries.length} Lint tests
                passed
              </AlertTitle>
            </Alert>
          </Box>
        </Stack>
        <ScrollContainer spacing={2}>
          {allQueries.map((saQ) => (
            <ResizePanel
              key={saQ.query.id}
              rightWidth={35}
              leftPanel={
                <ConsultQuery
                  header={
                    <>
                      <Typography variant={'caption'}>
                        Student output
                      </Typography>
                      <Typography variant={'caption'}>
                        Last run:{' '}
                        {saQ.studentOutput?.updatedAt &&
                          new Date(
                            saQ.studentOutput?.updatedAt,
                          ).toLocaleString()}
                      </Typography>
                    </>
                  }
                  query={saQ.query}
                  output={saQ.studentOutput?.output}
                />
              }
              rightPanel={
                <ConsultQuery
                  header={
                    <Typography variant={'caption'}>Solution output</Typography>
                  }
                  query={getSolutionQuery(saQ.query.order).query}
                  output={getSolutionQuery(saQ.query.order)?.output.output}
                />
              }
            />
          ))}
        </ScrollContainer>
      </Stack>
    )
  )
}

export default CompareDatabase
