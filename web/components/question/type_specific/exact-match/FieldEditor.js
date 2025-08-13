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

import { IconButton, Stack, TextField, Typography } from '@mui/material'
import MarkdownEditor from '@/components/input/markdown/MarkdownEditor'
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined'
import { styled } from '@mui/system'
import { useEffect, useState } from 'react'
import MarkdownViewer from '@/components/input/markdown/MarkdownViewer'
import DragHandleSVG from '@/components/layout/utils/DragHandleSVG'
import { useReorderable } from '@/components/layout/utils/ReorderableList'
import { useTheme } from '@emotion/react'

// Styled component to apply whitespace visibility
const MonoSpaceTextField = styled(TextField)({
  '& textarea': {
    whiteSpace: 'pre-wrap', // Preserves whitespaces and wraps text
    fontFamily: 'monospace', // Makes spaces more noticeable
  },
})
// TODO factorize this monospacetextfield.

const FieldEditor = ({
  index,
  groupScope,
  field,
  onChange,
  onDelete,
  mayDelete,
  previewMode,
}) => {
  const [regex, setRegex] = useState(field.matchRegex || '')
  const [statement, setStatement] = useState(field.statement || '')

  const {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    disabled,
    isDragging,
    getDragStyles,
  } = useReorderable()

  useEffect(() => {
    setRegex(field.matchRegex || '')
    setStatement(field.statement || '')
  }, [field.matchRegex, field.statement])

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
      <Stack direction={'column'} width={'100%'} height={'100%'} spacing={1}>
        {previewMode ? (
          <Stack direction={'column'} pb={1}>
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
                rawContent={statement}
                onChange={(newStatement) => {
                  if (newStatement === statement) return
                  setStatement(newStatement)
                  onChange({
                    ...field,
                    statement: newStatement,
                  })
                }}
              />
            </Stack>
          </Stack>
        )}
        <MonoSpaceTextField
          id={`regex-${field.id}`}
          variant="standard"
          label={'Expected Answer (Regex)'}
          value={regex}
          required
          fullWidth
          error={regex === '' || regex == null}
          onChange={(e) => {
            const newRegex = e.target.value
            if (newRegex === regex) return
            setRegex(newRegex)
            onChange({
              ...field,
              matchRegex: newRegex,
            })
          }}
        />
      </Stack>
    </Stack>
  )
}

export default FieldEditor
