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

import React from 'react'
import MDEditor from '@uiw/react-md-editor'
import { Box } from '@mui/material'
import { previewOptions } from './previewOptions'

const MarkdownViewer = ({ content, bgColor = 'transparent' }) => {
  return (
    <Box
      data-color-mode="light"
      sx={{
        '&[data-color-mode="light"] .wmde-markdown': {
          '--color-canvas-default': bgColor,
          backgroundColor: 'var(--color-canvas-default)',
          fontFamily: 'Monserrat',
        },
      }}
    >
      <MDEditor.Markdown source={content} {...previewOptions} />
    </Box>
  )
}

export default MarkdownViewer
