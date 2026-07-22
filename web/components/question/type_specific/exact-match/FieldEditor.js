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

import { IconButton, Stack, Typography } from '@mui/material'
import MarkdownEditor from '@/components/input/markdown/MarkdownEditor'
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined'
import { useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useSeededState } from '@/hooks/useSeededState'
import MarkdownViewer from '@/components/input/markdown/MarkdownViewer'
import DragHandleSVG from '@/components/layout/utils/DragHandleSVG'
import { useReorderable } from '@/components/layout/utils/ReorderableList'
import { useTheme } from '@emotion/react'
import { MonoSpaceTextField } from '@/components/input/MonoSpaceTextField'

const FieldEditor = ({
  index,
  groupScope,
  field,
  onChange,
  onSave,
  onDelete,
  mayDelete,
  previewMode,
}) => {
  // Each field owns its debounced save (same pattern as MultipleChoice
  // options): a debouncer shared across the list would drop field A's
  // save when field B is edited within the debounce window.
  const debouncedSave = useDebouncedCallback(onSave, 300)

  // Persist pending edits when the field unmounts (navigation).
  useEffect(() => {
    return () => {
      debouncedSave.flush()
    }
  }, [debouncedSave])
  // Live local mirrors: the preview renders `statement`, the regex field
  // needs its live value for the error indicator. Reset only per field.
  const [regex, setRegex] = useSeededState(field.matchRegex || '', field.id)
  const [statement, setStatement] = useSeededState(
    field.statement || '',
    field.id,
  )

  const {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    disabled,
    isDragging,
    getDragStyles,
  } = useReorderable()

  const theme = useTheme()

  return (
    <Stack
      direction={'row'}
      alignItems={'center'}
      spacing={2}
      sx={getDragStyles(index)}
      p={2}
      borderRadius={2}
      onDragOver={(e) => handleDragOver(e, index)}
      onDragEnd={(e) => handleDragEnd(e, index)}
      bgcolor={theme.palette.background.default}
    >
      <Stack
        sx={{
          cursor: disabled ? 'not-allowed' : 'grab',
          '&:active': {
            cursor: 'grabbing',
          },
        }}
        draggable={!disabled}
        onDragStart={(e) => handleDragStart(e, index)}
      >
        <DragHandleSVG />
      </Stack>
      <Stack direction={'column'} width={'100%'} height={'100%'} spacing={0}>
        {previewMode ? (
          <Stack direction={'column'} pb={0}>
            <MarkdownViewer content={statement} />
          </Stack>
        ) : (
          <Stack direction={'column'} width={'100%'} height={'100%'}>
            <Stack
              direction={'row'}
              spacing={1}
              alignItems={'center'}
              justifyContent={'space-between'}
            >
              <Typography variant={'h6'}>Field {index + 1}</Typography>
              <IconButton
                onClick={() => onDelete(field.id)}
                color="error"
                disabled={!mayDelete || isDragging}
              >
                <DeleteForeverOutlinedIcon />
              </IconButton>
            </Stack>
            <Stack minHeight={250} py={1}>
              <MarkdownEditor
                id={field.id}
                groupScope={groupScope}
                contentKey={`exact-field-statement:${field.id}`}
                defaultValue={field.statement || ''}
                onChange={(newStatement) => {
                  setStatement(newStatement)
                  const newField = {
                    ...field,
                    statement: newStatement,
                  }
                  onChange(newField)
                  debouncedSave(newField)
                }}
              />
            </Stack>
          </Stack>
        )}
        <MonoSpaceTextField
          id={`regex-${field.id}`}
          variant="standard"
          label={previewMode ? 'Answer' : 'Expected Answer (Regex)'}
          value={previewMode ? '' : regex}
          disabled={previewMode}
          required
          fullWidth
          error={regex === '' || regex == null}
          onChange={(e) => {
            const newRegex = e.target.value
            if (newRegex === regex) return
            setRegex(newRegex)
            const newField = {
              ...field,
              matchRegex: newRegex,
            }
            onChange(newField)
            debouncedSave(newField)
          }}
        />
      </Stack>
    </Stack>
  )
}

export default FieldEditor
