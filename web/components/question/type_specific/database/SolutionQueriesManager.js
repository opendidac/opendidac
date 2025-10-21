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
import { fetcher } from '../../../../code/utils'
import Loading from '../../../feedback/Loading'
import { Button, Stack, Typography, useTheme } from '@mui/material'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import ScrollContainer from '../../../layout/ScrollContainer'

import { useDebouncedCallback } from 'use-debounce'

import QueryOutput from './QueryOutput'
import QueryUpdatePanel from './QueryUpdatePanel'
import QueryEditor from './QueryEditor'
import DateTimeAgo from '../../../feedback/DateTimeAgo'
import StudentPermissionIcon from '../../../feedback/StudentPermissionIcon'
import BottomCollapsiblePanel from '../../../layout/utils/BottomCollapsiblePanel'

const SolutionQueriesManager = ({ groupScope, questionId, onUpdate }) => {
  const theme = useTheme()

  const ref = useRef()

  const { data, mutate, error } = useSWR(
    `/api/${groupScope}/questions/${questionId}/database/queries`,
    groupScope && questionId ? fetcher : null,
    { revalidateOnFocus: false },
  )

  const [queries, setQueries] = useState()
  const [outputs, setOutputs] = useState()
  const [activeQuery, setActiveQuery] = useState(null)

  useEffect(() => {
    if (!data) return
    // remove outputs from queries, outputs are managed in a separate state
    setQueries(data.map((q) => q.query))
    setOutputs(data.map((q) => q.output))
  }, [data])

  const runAllQueries = useCallback(async () => {
    // erase eventual previous outputs
    setOutputs(
      queries.map((q, index) => ({
        ...outputs[index],
        output: {
          ...outputs[index]?.output,
          result: null,
          status: 'RUNNING',
        },
      })) || [],
    )

    // erase eventual lintResults
    setQueries(
      queries.map((q, index) => ({
        ...q,
        lintResult: null,
      })) || [],
    )

    const newSolutionQueries = await fetch(
      `/api/sandbox/${questionId}/database`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    ).then((res) => res.json())

    // update the queries with the new lint results
    setQueries(
      queries.map((q, index) => ({
        ...q,
        lintResult: newSolutionQueries[index].query.lintResult,
      })) || [],
    )

    // set all query outputs
    setOutputs(newSolutionQueries.map((q) => q.output))

    onUpdate && onUpdate()
  }, [questionId, outputs, queries, onUpdate])

  // Add effect to automatically run queries if outputs are not defined
  useEffect(() => {
    if (queries && (!outputs || outputs.every((output) => output === null))) {
      runAllQueries()
    }
  }, [queries, outputs, runAllQueries])

  const onAddQuery = useCallback(async () => {
    await fetch(`/api/${groupScope}/questions/${questionId}/database/queries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
      .then(async () => {
        await mutate()
        ref.current.scrollTop = ref.current.scrollHeight
      })
      .finally(() => {
        onUpdate && onUpdate()
      })
  }, [groupScope, mutate, onUpdate, questionId])

  const onQueryUpdate = useCallback(
    async (query, doMutate = false) => {
      await fetch(
        `/api/${groupScope}/questions/${questionId}/database/queries/${query.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(query),
        },
      )
        .then(async () => {
          if (!doMutate) {
            const queryRef = queries.find((q) => q.id === query.id)
            if (!queryRef) {
              return
            }
            // update in memory to avoid re-fetching and re-rendering the full list of queries
            queryRef.title = query.title
            queryRef.description = query.description
            queryRef.lintRules = query.lintRules
            queryRef.content = query.content
            queryRef.template = query.template
            queryRef.queryOutputTests = query.queryOutputTests
          } else {
            await mutate()
          }
        })
        .finally(() => {
          onUpdate && onUpdate()
        })
    },
    [groupScope, queries, questionId, mutate, onUpdate],
  )

  const debouncedOnQueryUpdate = useDebouncedCallback(
    (q, m) => onQueryUpdate(q, m),
    500,
  )

  const onQueryDelete = useCallback(
    async (query) => {
      await fetch(
        `/api/${groupScope}/questions/${questionId}/database/queries/${query.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )
        .then(async () => {
          await mutate()
        })
        .finally(() => {
          onUpdate && onUpdate()
        })
    },
    [groupScope, mutate, questionId, onUpdate],
  )

  const getBorderStyle = useCallback(
    (index) => {
      return index === activeQuery ? theme.palette.primary.dark : 'transparent'
    },
    [activeQuery, theme],
  )

  return (
    <Loading loading={!queries} errors={[error]}>
      <BottomCollapsiblePanel
        bottomPanel={
          queries?.length > 0 &&
          activeQuery !== null && (
            <QueryUpdatePanel
              query={queries[activeQuery]}
              output={outputs[activeQuery]}
              onChange={(q) => debouncedOnQueryUpdate(q, true)}
              onDelete={(q) => onQueryDelete(q)}
            />
          )
        }
      >
        <Stack
          direction={'row'}
          spacing={1}
          alignItems={'center'}
          justifyContent={'space-between'}
          p={1}
        >
          <Button
            variant={'outlined'}
            color={'info'}
            onClick={() => runAllQueries()}
          >
            Run all
          </Button>
          <Button onClick={onAddQuery}>Add new query</Button>
        </Stack>
        <ScrollContainer ref={ref} pb={24}>
          {queries?.map((query, index) => (
            <Stack
              key={query.id}
              position="relative"
              onClick={() => setActiveQuery(index)}
              sx={{
                cursor: 'pointer',
                borderLeft: `3px solid ${getBorderStyle(index)}`,
              }}
            >
              <QueryEditor
                key={query.id}
                headerLeft={
                  <StudentPermissionIcon
                    permission={query.studentPermission}
                    size={16}
                  />
                }
                query={query}
                onChange={(q) => debouncedOnQueryUpdate(q)}
              />
              {outputs[index] && (
                <QueryOutput
                  header={
                    <>
                      <Typography variant={'caption'}>Last run:</Typography>
                      {outputs[index]?.updatedAt && (
                        <DateTimeAgo
                          date={new Date(outputs[index].updatedAt)}
                        />
                      )}
                    </>
                  }
                  result={outputs[index].output}
                  lintResult={query.lintResult}
                />
              )}
            </Stack>
          ))}
        </ScrollContainer>
      </BottomCollapsiblePanel>
    </Loading>
  )
}

export default SolutionQueriesManager
