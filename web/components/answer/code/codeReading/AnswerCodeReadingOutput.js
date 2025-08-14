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
import { Box, Stack, Typography } from '@mui/material'
import InlineMonacoEditor from '@/components/input/InlineMonacoEditor'
import outputEditorOptions from '@/components/question/type_specific/code/codeReading/outputEditorOptions.json'

const AnswerCodeReadingOutput = ({
  language,
  snippet,
  output: initial,
  status,
  onOutputChange,
}) => {
  const [output, setOutput] = useState(initial || '')

  useEffect(() => {
    setOutput(initial || '')
  }, [initial])

  return (
    <Box>
      {/* Read-only snippet preview */}
      <InlineMonacoEditor
        readOnly
        language={language}
        minHeight={30}
        code={snippet}
        editorOptions={{
          wordWrap: 'on',
          minimap: { enabled: false },
        }}
      />

      {/* Status + student output editor */}
      <Box p={1}>
        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
          <Typography variant="caption" color="text.secondary">
            {status}
          </Typography>
          <Typography variant="caption">Guess the output</Typography>
        </Stack>

        <InlineMonacoEditor
          language="plaintext"
          minHeight={60}
          readOnly={false}
          code={output}
          editorOptions={outputEditorOptions}
          onChange={(val) => {
            setOutput(val ?? '')
            onOutputChange?.(val ?? '')
          }}
        />

        <Typography variant="caption" color="text.secondary">
          Supports multiple lines. Careful with whitespaces.
        </Typography>
      </Box>
    </Box>
  )
}

export default AnswerCodeReadingOutput
