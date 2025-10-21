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
import { Stack } from '@mui/system'
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

  // Options CRUD is handled inside MultipleChoice; this callback only triggers refresh
  const onOptionsChanged = useCallback(async () => {
    await mutate()
    onUpdate && onUpdate()
  }, [mutate, onUpdate])

  // Add option is handled inside MultipleChoice

  // Reorder saving handled inside MultipleChoice

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
          {/* Add moved into MultipleChoice */}
          <ToggleWithLabel
            label="Preview Mode"
            checked={previewMode}
            onChange={(e) => setPreviewMode(e.target.checked)}
          />
        </Stack>

        <Stack px={2} spacing={2} flex={1}>
          <MultipleChoice
            groupScope={groupScope}
            questionId={questionId}
            limiterActivated={multipleChoice?.activateSelectionLimit}
            options={multipleChoice?.options}
            previewMode={previewMode}
            onOptionsChanged={onOptionsChanged}
          />
        </Stack>
      </Stack>
    </Loading>
  )
}

export default ManageMultipleChoice
