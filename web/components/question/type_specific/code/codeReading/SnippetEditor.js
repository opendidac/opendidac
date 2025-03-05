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
import React, { useEffect, useState } from 'react'
import { Stack, Typography, IconButton, Box, TextField } from '@mui/material'
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined'
import InlineMonacoEditor from '@/components/input/InlineMonacoEditor'

import { styled } from '@mui/system'

// Styled component to apply whitespace visibility
const MonoSpaceTextField = styled(TextField)({
  '& textarea': {
    whiteSpace: 'pre-wrap', // Preserves whitespaces and wraps text
    fontFamily: 'monospace', // Makes spaces more noticeable
  },
})

const SnippetEditor = ({
  index,
  snippet,
  language,
  isOutputEditable,
  onSnippetChange,
  onOutputChange,
  onDelete,
}) => {
  const [code, setCode] = useState(snippet.snippet)
  const [output, setOutput] = useState(snippet.output)

  useEffect(() => {
    setCode(snippet.snippet || '')
    setOutput(snippet.output || '')
  }, [snippet.snippet, snippet.output])

  return (
    <Stack direction={'column'} key={index} spacing={1}>
      <Stack
        direction={'row'}
        spacing={1}
        alignItems={'center'}
        justifyContent={'space-between'}
        pl={1}
      >
        <Typography variant="h6">Snippet {index + 1}</Typography>
        <IconButton onClick={() => onDelete(snippet.id)} color="error">
          <DeleteForeverOutlinedIcon />
        </IconButton>
      </Stack>
      <InlineMonacoEditor
        key={index}
        language={language}
        minHeight={60}
        code={code}
        onChange={(code) => {
          setCode(code)
          setOutput('')
          onSnippetChange(code)
        }}
      />
      <Box px={1}>
        <MonoSpaceTextField
          id={`output-${index}`}
          variant="standard"
          label={`Output`}
          value={output}
          multiline
          required
          fullWidth
          InputProps={{
            readOnly: !isOutputEditable,
          }}
          error={output === '' || output == null}
          onChange={(ev) => {
            setOutput(ev.target.value)
            onOutputChange(ev.target.value)
          }}
          helperText={
            output === '' || output == null
              ? 'Dont forget to run the snippets to get the output'
              : ''
          }
        />
      </Box>
    </Stack>
  )
}

export default SnippetEditor
