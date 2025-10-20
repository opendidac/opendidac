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

import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/code/utils'
import SnippetEditor from './SnippetEditor'
import RunSnippets from './RunSnippets'
import Loading from '@/components/feedback/Loading'
import { Alert, AlertTitle, Button, Stack, Typography } from '@mui/material'
import { useDebouncedCallback } from 'use-debounce'
import SnippetStatuBar from './SnippetStatuBar'
import BottomCollapsiblePanel from '@/components/layout/utils/BottomCollapsiblePanel'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'

const SnippetStatus = {
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  NEUTRAL: 'NEUTRAL',
  RUNNING: 'RUNNING',
}

const Snippets = ({ groupScope, questionId, language, onUpdate }) => {
  const [lock, setLock] = useState(false)
  const [statuses, setStatuses] = useState([])

  const [snippets, setSnippets] = useState([])

  const { data, error, mutate } = useSWR(
    `/api/${groupScope}/questions/${questionId}/code/code-reading/snippets`,
    groupScope && questionId ? fetcher : null,
    { revalidateOnFocus: false },
  )

  useEffect(() => {
    if (!data) return
    setStatuses(
      data.map((snippet) => {
        if (!snippet.output) return SnippetStatus.ERROR

        return SnippetStatus.SUCCESS
      }),
    )
    setSnippets(data)
  }, [data])

  const onAddSnippet = useCallback(async () => {
    setLock(true)
    await fetch(
      `/api/${groupScope}/questions/${questionId}/code/code-reading/snippets`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: statuses.length }),
      },
    ).then((data) => data.json())
    setLock(false)
    onUpdate && onUpdate()
    mutate()
  }, [groupScope, questionId, onUpdate, mutate, statuses])

  const onUpdateSnippet = useCallback(
    async (snippetId, snippet) => {
      const body = {
        snippet: snippet.snippet || '',
        output: snippet.output || '',
      }
      setLock(true)
      await fetch(
        `/api/${groupScope}/questions/${questionId}/code/code-reading/snippets/${snippetId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      ).then((data) => data.json())
      onUpdate && onUpdate()
      setLock(false)
    },
    [groupScope, questionId, onUpdate],
  )

  const debouncedUpdateSnippet = useDebouncedCallback(onUpdateSnippet, 500)

  const onDeleteSnippet = useCallback(
    async (snippetId) => {
      setLock(true)
      await fetch(
        `/api/${groupScope}/questions/${questionId}/code/code-reading/snippets/${snippetId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        },
      ).then((data) => data.json())
      mutate()
      setLock(false)
      onUpdate && onUpdate()
    },
    [groupScope, questionId, onUpdate, mutate],
  )

  const onBeforeRun = useCallback(() => {
    setStatuses((prev) => prev.map(() => SnippetStatus.RUNNING))
  }, [])

  const onAfterRun = useCallback(async (result) => {
    setStatuses((prev) =>
      prev.map((_, index) => {
        const test = result?.tests?.[index]
        if (!test) return SnippetStatus.ERROR
        return test.output ? SnippetStatus.SUCCESS : SnippetStatus.ERROR
      }),
    )

    // update snippets with the new outputs while preserving current code
    setSnippets((prev) =>
      prev.map((snippet, index) => ({
        ...snippet,
        output: result?.tests?.[index]?.output ?? snippet.output,
      })),
    )
  }, [])

  return (
    <Loading loading={!data} errors={[error]}>
      <Stack
        direction={'row'}
        alignItems={'center'}
        p={1}
        justifyContent={'space-between'}
      >
        <Button onClick={onAddSnippet}>Add Snippet</Button>
        <UserHelpPopper
          label={'Risks related to manual output editing'}
          mode={'warning'}
        >
          <Stack spacing={1}>
            <Typography variant="body2">
              It is recommended to (Run Snippets) to make the outputs filled.
              However, if you need to manually edit the output, please consider
              the following risks:
            </Typography>
            <Alert severity="warning">
              <AlertTitle>Risks of Manual Output Editing</AlertTitle>
              <Typography variant="body2">
                Manually editing the outputs introduces several risks that
                should be carefully considered:
                <ul>
                  <li>
                    <strong>Mismatch with Snippet:</strong> The manually edited
                    output might not accurately represent the code
                    snippet&apos;s actual behavior, leading to inconsistencies.
                  </li>
                  <li>
                    <strong>Forgotten Details:</strong> Minor details like
                    whitespace, formatting, or special characters might be
                    overlooked, causing discrepancies in automated checks or
                    evaluations.
                  </li>
                  <li>
                    <strong>Impact on Grading:</strong> Grading tool rely on
                    outputs and may fail to award points or provide accurate
                    information to the professor.
                  </li>
                  <li>
                    <strong>Overriding of Manual Edits:</strong> If the
                    &quot;Run Snippets&quot; functionality is used, any manually
                    edited outputs will be overridden by the automatic process,
                    discarding manual changes.
                  </li>
                </ul>
              </Typography>
            </Alert>
          </Stack>
        </UserHelpPopper>
      </Stack>

      <SnippetStatuBar statuses={statuses} />

      <Stack flex={1}>
        <BottomCollapsiblePanel
          bottomPanel={
            <RunSnippets
              lock={lock}
              questionId={questionId}
              onBeforeRun={onBeforeRun}
              onUpdate={onAfterRun}
            />
          }
        >
          {snippets?.map((snippet, index) => (
            <SnippetEditor
              key={index}
              index={index}
              snippet={snippet}
              language={language}
              isOutputEditable
              onSnippetChange={(code) => {
                const updatedStatuses = statuses.map((s, i) => {
                  if (i === index) return SnippetStatus.ERROR
                  return s
                })
                setStatuses(updatedStatuses)
                // update local snippet immediately to avoid stale overwrite on run
                setSnippets((prev) =>
                  prev.map((s, i) =>
                    i === index ? { ...s, snippet: code, output: null } : s,
                  ),
                )
                debouncedUpdateSnippet(snippet.id, {
                  ...snippet,
                  snippet: code,
                  output: null,
                })
              }}
              onOutputChange={(output) => {
                const updatedStatuses = statuses.map((s, i) => {
                  if (i === index) return SnippetStatus.NEUTRAL
                  return s
                })
                setStatuses(updatedStatuses)
                // mirror local output changes as well
                setSnippets((prev) =>
                  prev.map((s, i) => (i === index ? { ...s, output } : s)),
                )
                debouncedUpdateSnippet(snippet.id, {
                  ...snippet,
                  output,
                })
              }}
              onDelete={onDeleteSnippet}
            />
          ))}
        </BottomCollapsiblePanel>
      </Stack>
    </Loading>
  )
}

export default Snippets
