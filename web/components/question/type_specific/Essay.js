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
import MarkdownEditor from '../../input/markdown/MarkdownEditor'
import { Stack } from '@mui/material'

const Essay = ({ id = 'essay', groupScope, solution, template, onChange }) => {
  return (
    <Stack
      spacing={1}
      width="100%"
      height="100%"
      position="relative"
      px={1}
      pt={1}
    >
      <MarkdownEditor
        id={id}
        title={'Solution Answer'}
        groupScope={groupScope}
        rawContent={solution}
        onChange={(newContent) => {
          if (newContent === solution) return
          onChange('solution', newContent === '' ? undefined : newContent)
        }}
      />
      <MarkdownEditor
        id={id}
        title={'Student Starting Template'}
        groupScope={groupScope}
        rawContent={template}
        onChange={(newContent) => {
          if (newContent === template) return
          onChange('template', newContent === '' ? undefined : newContent)
        }}
      />
    </Stack>
  )
}

export default Essay
