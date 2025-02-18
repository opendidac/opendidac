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
import { useCallback, useEffect, useState } from 'react'
import { Stack } from '@mui/material'
import { useDebouncedCallback } from 'use-debounce'
import { useSnackbar } from '@/context/SnackbarContext'
import BottomCollapsiblePanel from '@/components/layout/utils/BottomCollapsiblePanel'
import AddendumHeader from './AddendumHeader'
import AddendumContent from './AddendumContent'

const QuestionAddendum = ({
  evaluationId,
  evaluationToQuestion,
  groupScope,
  readOnly = false,
  onAddendumChanged,
  children,
}) => {
  const { show: showSnackbar } = useSnackbar()
  const [addendum, setAddendum] = useState(evaluationToQuestion?.addendum || '')

  useEffect(() => {
    setAddendum(evaluationToQuestion?.addendum || '')
  }, [evaluationToQuestion])

  const debounceAddendumChange = useDebouncedCallback(
    useCallback(
      async (addendum) => {
        if (!evaluationToQuestion) return

        try {
          const response = await fetch(
            `/api/${groupScope}/evaluations/${evaluationId}/questions/${evaluationToQuestion.questionId}/`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ addendum }),
            },
          )

          if (!response.ok) {
            throw new Error('Failed to update addendum')
          }
        } catch (error) {
          showSnackbar('Failed to save addendum', 'error')
        }
      },
      [groupScope, evaluationId, showSnackbar, evaluationToQuestion],
    ),
    500,
  )

  const handleAddendumChange = useCallback(
    (value) => {
      setAddendum(value)
      onAddendumChanged?.(value)
      debounceAddendumChange(value)
    },
    [onAddendumChanged, debounceAddendumChange],
  )

  // If there's no addendum and we're in readonly mode, just render the children
  if (readOnly && !addendum) {
    return children
  }

  return (
    <BottomCollapsiblePanel
      open={addendum?.length > 0}
      width={'100%'}
      bottomPanel={
        <Stack>
          <AddendumHeader
            showOpenButton
            addendum={addendum}
            readOnly={readOnly}
          />
          <AddendumContent
            groupScope={groupScope}
            addendum={addendum}
            readOnly={readOnly}
            onAddendumChange={handleAddendumChange}
          />
        </Stack>
      }
    >
      {children}
    </BottomCollapsiblePanel>
  )
}

export default QuestionAddendum
