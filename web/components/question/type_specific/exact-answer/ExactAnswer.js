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
import { Stack } from '@mui/material'
import FieldEditor from '@/components/question/type_specific/exact-answer/FieldEditor'

const ExactAnswer = ({ id = 'exactAnswer', groupScope, fields, onChange }) => {
  const onDelete = useCallback((index) => {
    const updatedFields = fields.filter((_, i) => i !== index)
    onChange('fields', updatedFields)
  }, [fields, onChange])

  const onFieldChange = useCallback((index, field) => {
    const updatedFields = [...fields]
    updatedFields[index] = newField
    onChange('fields', updatedFields)
  }, [fields, onChange])

  return (
    <Stack
      spacing={1}
      width="100%"
      height="100%"
      position="relative"
      px={1}
      pt={1}
    >
      {fields.map((field, index) => (
        <FieldEditor
          index={index}
          groupScope={groupScope}
          key={field.id}
          field={field}
          onChange={ onFieldChange }
          onDelete={ onDelete }
        ></FieldEditor>
      ))}

    </Stack>
  )
}

export default ExactAnswer
