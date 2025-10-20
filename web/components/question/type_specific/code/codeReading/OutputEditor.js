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

// components/input/OutputMonacoEditor.tsx
import React from 'react'
import { Box, Stack, Typography } from '@mui/material'
import InlineMonacoEditor from '@/components/input/InlineMonacoEditor'

const OutputMonacoEditor = ({
  value,
  onChange,
  readOnly = false,
  language = 'plaintext',
  minHeight = 60,
  label = 'Output',
  helperText,
  startAdornment,
  wordWrap = 'off',
  showErrorWhenEmpty = false,
  editorOptions = {},
}) => {
  const empty = value == null || value === ''

  return (
    <Box px={1}>
      {(label || startAdornment) && (
        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
          {startAdornment}
          {label && (
            <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
              {label}
              {readOnly ? ' (read only)' : ''}
            </Typography>
          )}
        </Stack>
      )}

      <InlineMonacoEditor
        language={language}
        minHeight={minHeight}
        readOnly={readOnly}
        code={value}
        editorOptions={{
          // sensible defaults for an "output" field
          lineNumbers: 'off',
          folding: false,
          wordWrap,
          renderWhitespace: 'all',
          renderControlCharacters: true,
          lineNumbersMinChars: 0,
          // allow callers to override
          ...editorOptions,
        }}
        onChange={onChange}
      />

      {(helperText || showErrorWhenEmpty) && (
        <Typography
          variant="caption"
          sx={{
            color:
              empty && showErrorWhenEmpty ? 'error.main' : 'text.secondary',
          }}
        >
          {empty && showErrorWhenEmpty
            ? "Don't forget to run the snippets to get the output"
            : (helperText ?? ' ')}
        </Typography>
      )}
    </Box>
  )
}

export default OutputMonacoEditor
