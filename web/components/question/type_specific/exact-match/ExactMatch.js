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
import FieldEditor from '@/components/question/type_specific/exact-match/FieldEditor'
import AddIcon from '@mui/icons-material/Add'
import ToggleWithLabel from '@/components/input/ToggleWithLabel'
import ScrollContainer from '@/components/layout/ScrollContainer'
import ReorderableList from '@/components/layout/utils/ReorderableList'
import { useDebouncedCallback } from 'use-debounce'

const ExactMatch = ({
  id = 'exactMatch',
  groupScope,
  questionId,
  fields: initialFields,
  onChange,
  // TODO handle all warnings
}) => {
  const [previewMode, setPreviewMode] = React.useState(false)
  const [fields, setFields] = React.useState(initialFields || [])

  const onAddField = useCallback(async () => {
    const response = await fetch(
      `/api/${groupScope}/questions/${questionId}/exact-match/fields`,
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
          },
        }),
      },
    )
    // TODO do I need to do something to handle failure?
    const newField = await response.json()
    const newFields = [...fields, newField]
    setFields(newFields)
  }, [groupScope, questionId, fields])

  const onFieldChange = useCallback(
    async (newField) => {
      await fetch(
        `/api/${groupScope}/questions/${questionId}/exact-match/fields`,
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

      const updatedFields = fields.map((field) =>
        field.id === newField.id ? newField : field,
      )
      setFields(updatedFields)
      // No need to call onChange here, as the field change is already handled by the PUT request
    },
    [fields, groupScope, questionId],
  )

  const onDelete = useCallback(
    async (id) => {
      if (fields.length <= 1) {
        // Do not allow to delete the last field
        console.warn('Cannot delete the last field')
        return
      }
      await fetch(
        `/api/${groupScope}/questions/${questionId}/exact-match/fields`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            fieldId: id,
          }),
        },
      )
      // TODO do I need to do something to handle failure?
      const updatedFields = fields.filter((field) => field.id !== id)
      setFields(updatedFields)
      // No need to call onChange here, as the field deletion is already handled by the DELETE request
    },
    [fields, groupScope, questionId],
  )

  const saveOrder = useCallback(
    async (reordered) => {
      await fetch(
        `/api/${groupScope}/questions/${questionId}/exact-match/order`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: reordered,
          }),
        },
      )
    },
    [groupScope, questionId],
  )

  const debounceSaveOrdering = useDebouncedCallback(saveOrder, 300)

  const onReorder = useCallback(
    async (sourceIndex, targetIndex) => {
      const reorderedFields = [...fields]

      const [removedField] = reorderedFields.splice(sourceIndex, 1)
      reorderedFields.splice(targetIndex, 0, removedField)

      reorderedFields.forEach((field, index) => {
        field.order = index
      })

      setFields(reorderedFields)
      // No need to call onChange here, as the reordering is already handled by the PUT request
      debounceSaveOrdering(reorderedFields)
    },
    [debounceSaveOrdering, fields],
  )

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
      <ScrollContainer spacing={1}>
        <ReorderableList onChangeOrder={onReorder}>
          {fields.map((field, index) => (
            <FieldEditor
              key={field.id}
              index={index}
              groupScope={groupScope}
              field={field}
              onChange={onFieldChange}
              onDelete={onDelete}
              mayDelete={fields.length > 1}
              previewMode={previewMode}
            ></FieldEditor>
          ))}
        </ReorderableList>
      </ScrollContainer>
    </Stack>
  )
}

export default ExactMatch
