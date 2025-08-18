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
          sx={{ color: empty && showErrorWhenEmpty ? 'error.main' : 'text.secondary' }}
        >
          {empty && showErrorWhenEmpty ? "Don't forget to run the snippets to get the output" : (helperText ?? ' ')}
        </Typography>
      )}
    </Box>
  )
}

export default OutputMonacoEditor
