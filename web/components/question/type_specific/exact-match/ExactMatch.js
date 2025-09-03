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
import React, { useCallback, useEffect } from 'react'
import { Button, Stack } from '@mui/material'
import FieldEditor from '@/components/question/type_specific/exact-match/FieldEditor'
import AddIcon from '@mui/icons-material/Add'
import ToggleWithLabel from '@/components/input/ToggleWithLabel'
import ScrollContainer from '@/components/layout/ScrollContainer'
import ReorderableList from '@/components/layout/utils/ReorderableList'
import { useDebouncedCallback } from 'use-debounce'
import { useSnackbar } from '@/context/SnackbarContext'
import { fetcher } from '@/code/utils'
import useSWR from 'swr'
import Loading from '@/components/feedback/Loading'

const ExactMatch = ({ groupScope, questionId, onFieldsChange }) => {
  const [previewMode, setPreviewMode] = React.useState(false)

  const { show: showSnackbar } = useSnackbar()

  const {
    data: loadedFields,
    isLoading: isLoadingFields,
    error: loadingError,
  } = useSWR(
    `/api/${groupScope}/questions/${questionId}/exact-match/fields`,
    groupScope && questionId ? fetcher : null,
    { revalidateOnFocus: false },
  )

  const [fields, setFieldsState] = React.useState(
    isLoadingFields || loadingError ? [] : loadedFields,
  )
  const setFields = useCallback(
    (newFields) => {
      setFieldsState(newFields)
      onFieldsChange(newFields)
    },
    [setFieldsState, onFieldsChange],
  )

  useEffect(() => {
    if (!isLoadingFields) {
      if (loadingError) {
        console.error(`Failed to load fields: ${loadingError}`)
        showSnackbar(`Failed to load fields. Please try again.`, 'error')
      } else {
        setFieldsState(loadedFields)
      }
    }
  }, [isLoadingFields, loadedFields, loadingError, showSnackbar])

  const onAddField = useCallback(async () => {
    try {
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

      const newField = await response.json()
      const newFields = [...fields, newField]
      setFields(newFields)

      showSnackbar('Field added successfully', 'success')
    } catch (error) {
      console.error('Failed to add field', error)
      showSnackbar('Failed to add field', 'error')
    }
  }, [groupScope, questionId, fields, setFields, showSnackbar])

  const debouncedAddField = useDebouncedCallback(onAddField, 300)

  const onFieldChange = useCallback(
    async (newField) => {
      try {
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
        const updatedFields = fields.map((field) =>
          field.id === newField.id ? newField : field,
        )
        setFields(updatedFields)

        showSnackbar('Field saved successfully', 'success')
      } catch (error) {
        console.error('Failed to save field change', error)
        showSnackbar('Failed to save field change', 'error')
      }
    },
    [fields, groupScope, questionId, setFields, showSnackbar],
  )
  const debouncedFieldChange = useDebouncedCallback(onFieldChange, 300)

  const onDelete = useCallback(
    async (id) => {
      if (fields.length <= 1) {
        // Do not allow to delete the last field
        console.warn('Cannot delete the last field')
        return
      }

      try {
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

        const updatedFields = fields.filter((field) => field.id !== id)
        setFields(updatedFields)

        showSnackbar('Field deleted successfully', 'success')
      } catch (error) {
        console.error('Failed to delete field', error)
        showSnackbar('Failed to delete field', 'error')
      }
    },
    [fields, groupScope, questionId, setFields, showSnackbar],
  )
  const debouncedDelete = useDebouncedCallback(onDelete, 300)

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
        .then((_) => {
          showSnackbar('Field order saved successfully', 'success')
        })
        .catch((error) => {
          console.error('Failed to save field order', error)
          showSnackbar('Failed to save field order', 'error')
        })
    },
    [groupScope, questionId, showSnackbar],
  )

  const debouncedSaveOrdering = useDebouncedCallback(saveOrder, 300)

  const onReorder = useCallback(
    async (sourceIndex, targetIndex) => {
      const reorderedFields = [...fields]

      const [removedField] = reorderedFields.splice(sourceIndex, 1)
      reorderedFields.splice(targetIndex, 0, removedField)

      reorderedFields.forEach((field, index) => {
        field.order = index
      })

      setFields(reorderedFields)
      debouncedSaveOrdering(reorderedFields)
    },
    [debouncedSaveOrdering, fields, setFields],
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
          onClick={debouncedAddField}
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
      <Loading errors={[loadingError]} loading={isLoadingFields}>
        <ScrollContainer spacing={1}>
          <ReorderableList onChangeOrder={onReorder}>
            {fields.map((field, index) => (
              <FieldEditor
                key={field.id}
                index={index}
                groupScope={groupScope}
                field={field}
                onChange={debouncedFieldChange}
                onDelete={debouncedDelete}
                mayDelete={fields.length > 1}
                previewMode={previewMode}
              ></FieldEditor>
            ))}
          </ReorderableList>
        </ScrollContainer>
      </Loading>
    </Stack>
  )
}

export default ExactMatch
