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
import React, { useState, useCallback } from 'react'
import { Stack, TextField } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useBottomPanel } from '@/context/BottomPanelContext'
import BottomPanelHeader from '@/components/layout/utils/BottomPanelHeader'
import BottomPanelContent from '@/components/layout/utils/BottomPanelContent'

const RunSnippets = ({ lock, questionId, onBeforeRun, onUpdate }) => {
  const [result, setResult] = useState(null)
  const [snippetsRunning, setSnippetsRunning] = useState(false)

  const { openPanel } = useBottomPanel()

  const onRunAll = useCallback(async () => {
    setSnippetsRunning(true)
    onBeforeRun && onBeforeRun()
    const result = await fetch(`/api/sandbox/${questionId}/code-reading`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then((data) => data.json())
    setResult(result)
    if (result.beforeAll) {
      openPanel()
    }
    setSnippetsRunning(false)

    onUpdate && onUpdate(result)
  }, [questionId, onUpdate, openPanel, onBeforeRun])

  return (
    <Stack maxHeight={'calc(100% - 90px)'}>
      <BottomPanelHeader>
        <LoadingButton
          size="small"
          variant="contained"
          color="info"
          onClick={onRunAll}
          disabled={lock}
          loading={snippetsRunning}
        >
          Run Snippets
        </LoadingButton>
      </BottomPanelHeader>
      <BottomPanelContent>
          <Stack padding={0}>
            <TextField
              variant="filled"
              fullWidth
              multiline
              maxRows={12}
              focused
              color="info"
              label="Console"
              value={result?.beforeAll}
              InputProps={{
                readOnly: true,
              }}
            />
          </Stack>
      </BottomPanelContent>
    </Stack>
  )
}

export default RunSnippets
