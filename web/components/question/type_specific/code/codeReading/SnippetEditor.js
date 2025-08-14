/**
 * Copyright 2022-2024 HEIG-VD
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied.
 * See the License for the specific language governing permissions
 * and limitations under the License.
 */
import React, { useEffect, useState } from 'react'
import { Stack, Typography, IconButton, Box } from '@mui/material'
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined'
import InlineMonacoEditor from '@/components/input/InlineMonacoEditor'

const SnippetEditor = ({
  index,
  snippet,
  language,
  isOutputEditable,
  onSnippetChange,
  onOutputChange,
  onDelete,
}) => {
  
  const [code, setCode] = useState(snippet.snippet || '')
  const [output, setOutput] = useState(snippet.output || '')

  useEffect(() => {
    setCode(snippet.snippet || '')
    setOutput(snippet.output || '')
  }, [snippet])

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

      {/* Code editor */}
      <InlineMonacoEditor
        key={`code-${index}`}
        language={language}
        minHeight={60}
        code={code}
        onChange={(newCode) => {
          setCode(newCode)
          setOutput('')
          onSnippetChange(newCode)
        }}
      />

      {/* Output editor */}

      <OutputEditor 
        output={output} 
        isOutputEditable={isOutputEditable} 
        onOutputChange={(newOutput) => {
          setOutput(newOutput)
          onOutputChange(newOutput)
        }} 
      />
      
    </Stack>
  )
}

const outputEditorOptions = {
  wordWrap: 'on',                  // Wrap lines so text doesn't scroll horizontally
  renderWhitespace: 'all',         // Don't clutter with whitespace symbols
  lineNumbers: 'off',              // No line numbers for plain text
  lineDecorationsWidth: 0,         // Remove gutter decoration space
  lineNumbersMinChars: 0,          // No reserved chars for line numbers
  scrollBeyondLastLine: false,     // Avoid unnecessary vertical space
}


const OutputEditor = ({ output, isOutputEditable, onOutputChange }) => {
  return (
    <InlineMonacoEditor
      language="plaintext"
      minHeight={60}
      readOnly={!isOutputEditable}
      editorOptions={outputEditorOptions}
      code={output}
      onChange={(newOutput) => {
        onOutputChange(newOutput)
      }}
    />
  )
}

export default SnippetEditor
