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
import { useTheme } from '@emotion/react'
import { useEffect, useState } from 'react'

// Styled component to apply whitespace visibility
const MonoSpaceTextField = styled(TextField)({
  '& textarea': {
    whiteSpace: 'pre-wrap', // Preserves whitespaces and wraps text
    fontFamily: 'monospace', // Makes spaces more noticeable
  },
})
// TODO factorize this monospacetextfield.

const FieldEditor = ({ index, groupScope, field, onChange, onDelete, mayDelete }) => {
  const [regex, setRegex] = useState(field.matchRegex || '')

  useEffect(() => {
    setRegex(field.matchRegex || '')
  }, [field.matchRegex])

  const theme = useTheme()

  return (
    <Stack direction={'column'} height={'100%'}>
      <Stack
        direction={'row'}
        spacing={1}
        alignItems={'center'}
        justifyContent={'space-between'}
        pl={1}
      >
        <Typography variant={'h6'}>Field {index + 1}</Typography>
        <IconButton onClick={() => onDelete(index)} color="error" disabled={!mayDelete}>
          <DeleteForeverOutlinedIcon />
        </IconButton>
      </Stack>
      <Stack minHeight={250} py={1}>
        <MarkdownEditor
          id={field.id}
          title={field.title}
          groupScope={groupScope}
          rawContent={field.statement}
          onChange={(newStatement) => {
            if (newStatement === field.statement) return
            onChange({
              ...field,
              statement: newStatement,
            })
          }}
        />
      </Stack>
      <MonoSpaceTextField
        id={`regex-${field.id}`}
        variant="standard"
        label="Expected Answer (Regex)"
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
  )
}

export default FieldEditor
