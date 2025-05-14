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
import { useCallback, useState } from 'react'
import MultipleChoice from './MultipleChoice'
import Loading from '../../feedback/Loading'
import { fetcher } from '../../../code/utils'
import { useDebouncedCallback } from 'use-debounce'
import { Stack } from '@mui/system'
import { Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import MultipleChoiceConfig from './multiple-choice/MultipleChoiceConfig'
import ToggleWithLabel from '@/components/input/ToggleWithLabel'

const ManageMultipleChoice = ({ groupScope, questionId, onUpdate }) => {
  const [previewMode, setPreviewMode] = useState(false)
  const {
    data: multipleChoice,
    mutate,
    error,
  } = useSWR(
    `/api/${groupScope}/questions/${questionId}/multiple-choice`,
    groupScope && questionId ? fetcher : null,
    { revalidateOnFocus: false },
  )

  const saveMultipleChoice = useCallback(
    async (multipleChoice) => {
      await fetch(
        `/api/${groupScope}/questions/${questionId}/multiple-choice`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(multipleChoice),
        },
      )
        .then((data) => data.json())
        .then(async () => {
          await mutate()
        })
    },
    [groupScope, questionId, mutate],
  )

  const onPropertyChange = useCallback(
    async (property, value) => {
      multipleChoice[property] = value
      await saveMultipleChoice(multipleChoice)
      onUpdate && onUpdate()
    },
    [multipleChoice, saveMultipleChoice, onUpdate],
  )

  const onChangeOption = useCallback(
    async (newOption) => {
      await fetch(
        `/api/${groupScope}/questions/${questionId}/multiple-choice/options`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            option: newOption,
          }),
        },
      )
        .then(async (res) => {
          if (res.status === 200) {
            await mutate()
          }
        })
        .finally(() => {
          onUpdate && onUpdate()
        })
    },
    [groupScope, questionId, mutate, onUpdate],
  )

  const onDeleteOption = useCallback(
    async (deletedOption) => {
      await fetch(
        `/api/${groupScope}/questions/${questionId}/multiple-choice/options`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            option: deletedOption,
          }),
        },
      )
        .then(async (res) => {
          if (res.status === 200) {
            await mutate()
          }
        })
        .finally(() => {
          onUpdate && onUpdate()
        })
    },
    [groupScope, questionId, mutate, onUpdate],
  )

  const onAddOption = useCallback(async () => {
    await fetch(
      `/api/${groupScope}/questions/${questionId}/multiple-choice/options`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          option: {
            text: '',
            isCorrect: false,
          },
        }),
      },
    )
      .then(async (res) => {
        if (res.status === 200) {
          await mutate()
        }
      })
      .finally(() => {
        onUpdate && onUpdate()
      })
  }, [groupScope, questionId, mutate, onUpdate])

  const saveReOrder = useCallback(
    async (reordered) => {
      // save question order
      await fetch(
        `/api/${groupScope}/questions/${questionId}/multiple-choice/order`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            options: reordered,
          }),
        },
      )
    },
    [groupScope, questionId],
  )

  const debounceSaveOrdering = useDebouncedCallback(saveReOrder, 300)

  return (
    <Loading loading={!multipleChoice} errors={[error]}>
      <Stack spacing={2} mt={1} flex={1}>
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'flex-start'}
          px={1}
        >
          <MultipleChoiceConfig
            groupScope={groupScope}
            questionId={questionId}
            multipleChoice={multipleChoice}
            onPropertyChange={onPropertyChange}
            onUpdate={() => onUpdate()} // trigger parent update
          />
        </Stack>
        <Stack
          direction="row"
          px={1}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Button
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => onAddOption()}
            px={2}
          >
            Add Option
          </Button>
          <ToggleWithLabel
            label="Preview Mode"
            checked={previewMode}
            onChange={(e) => setPreviewMode(e.target.checked)}
          />
        </Stack>

        <Stack px={2} spacing={2} flex={1}>
          <MultipleChoice
            limiterActivated={multipleChoice?.activateSelectionLimit}
            options={multipleChoice?.options}
            previewMode={previewMode}
            onAdd={onAddOption}
            onChangeOption={async (newOption) => {
              await onChangeOption(newOption)
            }}
            onChangeOrder={async (reordered) => {
              await debounceSaveOrdering(reordered)
            }}
            onDelete={async (deletedOption) => {
              await onDeleteOption(deletedOption)
            }}
          />
        </Stack>
      </Stack>
    </Loading>
  )
}

export default ManageMultipleChoice
