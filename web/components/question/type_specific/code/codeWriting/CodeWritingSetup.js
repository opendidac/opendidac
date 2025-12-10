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
import TestCases from './TestCases'
import Sandbox from '../Sandbox'
import ToggleWithLabel from '@/components/input/ToggleWithLabel'
import { useDebouncedCallback } from 'use-debounce'

import { fetcher } from '@/core/utils'
import Loading from '@/components/feedback/Loading'
import { useCallback, useEffect, useState } from 'react'
import { Stack } from '@mui/material'

const CodeWritingSetup = ({ groupScope, language, questionId, onUpdate }) => {
  const { data: codeWriting, error } = useSWR(
    `/api/${groupScope}/questions/${questionId}/code/code-writing`,
    groupScope && questionId ? fetcher : null,
    { revalidateOnFocus: false },
  )

  const [codeCheckEnabled, setCodeCheckEnabled] = useState(
    codeWriting?.codeCheckEnabled ?? true,
  )

  useEffect(() => {
    if (codeWriting) {
      setCodeCheckEnabled(codeWriting.codeCheckEnabled)
    }
  }, [codeWriting])

  const onChange = useCallback(
    async (codeCheckEnabled) => {
      await fetch(
        `/api/${groupScope}/questions/${questionId}/code/code-writing`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            codeCheckEnabled,
          }),
        },
      ).finally(() => {
        onUpdate && onUpdate()
      })
    },
    [groupScope, questionId, onUpdate],
  )

  const debouncedOnChange = useDebouncedCallback(onChange, 500)

  return (
    <Loading loading={!codeWriting} errors={[error]}>
      <Stack direction="column" spacing={2} flex={1}>
        <ToggleWithLabel
          label="Allow students to use CodeCheck"
          checked={codeCheckEnabled}
          onChange={(ev) => {
            const newValue = ev.target.checked
            setCodeCheckEnabled(newValue)
            debouncedOnChange(newValue)
          }}
        />

        <Sandbox
          groupScope={groupScope}
          questionId={questionId}
          onUpdate={onUpdate}
        />
        <TestCases
          groupScope={groupScope}
          questionId={questionId}
          language={language}
          onUpdate={onUpdate}
        />
      </Stack>
    </Loading>
  )
}

export default CodeWritingSetup
