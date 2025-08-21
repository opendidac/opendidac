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
import { Box, InputAdornment } from '@mui/material'
import InlineMonacoEditor from '@/components/input/InlineMonacoEditor'

import { MonoSpaceTextField } from '@/components/input/MultiLineTextFields'

const AnswerCodeReadingOutput = ({
  language,
  snippet,
  output: initial,
  status,
  onOutputChange,
}) => {
  const [output, setOutput] = useState(initial)

  useEffect(() => {
    setOutput(initial)
  }, [initial])

  return (
    <Box>
      <InlineMonacoEditor
        readOnly
        language={language}
        minHeight={30}
        code={snippet}
      />
      <Box p={1}>
        <MonoSpaceTextField
          variant="standard"
          label="Guess the output"
          fullWidth
          multiline
          value={output || ''}
          onChange={(e) => {
            setOutput(e.target.value)
            onOutputChange(e.target.value)
          }}
          placeholder="..."
          helperText="Supports multiple lines. Careful with whitespaces."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box pt={0.5}>{status}</Box>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Box>
  )
}

export default AnswerCodeReadingOutput
