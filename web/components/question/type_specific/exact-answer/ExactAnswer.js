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
import { Button, Stack } from '@mui/material'
import FieldEditor from '@/components/question/type_specific/exact-answer/FieldEditor'
import AddIcon from '@mui/icons-material/Add'
import ToggleWithLabel from '@/components/input/ToggleWithLabel'

const ExactAnswer = ({ id = 'exactAnswer', groupScope, questionId, fields, onChange }) => {
  const [previewMode, setPreviewMode] = React.useState(false)

  const onAddField = useCallback(async () => {
    const response = await fetch(
      `/api/${groupScope}/questions/${questionId}/exact-answer/fields`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          field: {
            statement: '',
            matchRegex: '.*',
          }
        })
      },
    )
    // TODO do I need to do something to handle failure?
    const newField = await response.json()
    onChange('fields', [...fields, newField])
  }, [groupScope, questionId, fields, onChange])

  const onFieldChange = useCallback(async (newField) => {
    await fetch(
      `/api/${groupScope}/questions/${questionId}/exact-answer/fields`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          field: newField,
        }),
      },
    )
    // TODO do I need to do something to handle failure?
  }, [groupScope, questionId])

  const onDelete = useCallback(async (index) => {
    if (fields.length <= 1) {
      // Do not allow to delete the last field
      console.warn('Cannot delete the last field')
      return
    }
    await fetch(
      `/api/${groupScope}/questions/${questionId}/exact-answer/fields`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          fieldId: fields[index].id,
        }),
      }
    )
    // TODO do I need to do something to handle failure?
    const updatedFields = fields.filter((_, i) => i !== index)
    onChange('fields', updatedFields)
  }, [fields, groupScope, onChange, questionId])

  return (
    <Stack
      spacing={1}
      width="100%"
      height="100%"
      position="relative"
      px={1}
      pt={1}
    >
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
          onClick={() => onAddField()}
          px={2}
        >
          Add Field
        </Button>
        <ToggleWithLabel
          label="Preview Mode"
          checked={previewMode}
          onChange={(e) => setPreviewMode(e.target.checked)}
        />
      </Stack>
      {fields.map((field, index) => (
        <FieldEditor
          index={index}
          groupScope={groupScope}
          key={field.id}
          field={field}
          onChange={ onFieldChange }
          onDelete={ onDelete }
          mayDelete={ fields.length > 1 }
        ></FieldEditor>
      ))}

    </Stack>
  )
}

export default ExactAnswer
