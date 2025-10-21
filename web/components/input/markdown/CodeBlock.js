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
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import copyToClipboard from 'clipboard-copy'
import { useSnackbar } from '@/context/SnackbarContext'
import { useCallback } from 'react'
import { Box, Button } from '@mui/material'
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism'

const CodeBlock = ({ language, value }) => {
  const { show: showSnackbar } = useSnackbar()

  const handleCopyToClipboard = useCallback(
    (code) => {
      copyToClipboard(code)
      // Optional: Show a notification or tooltip saying "Copied!"
      showSnackbar('Copied!', 'success')
    },
    [showSnackbar],
  )

  return (
    <Box borderRadius={1} position={'relative'}>
      <SyntaxHighlighter language={language} style={coy}>
        {value}
      </SyntaxHighlighter>
      <Button
        size="small"
        sx={{ position: 'absolute', top: 0, right: 0 }}
        onClick={() => handleCopyToClipboard(value)}
      >
        Copy
      </Button>
    </Box>
  )
}

export default CodeBlock
