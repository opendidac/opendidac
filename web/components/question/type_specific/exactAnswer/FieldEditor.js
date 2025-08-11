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

import { Stack } from '@mui/material'

const FieldEditor = ({ groupScope, questionId, field, onUpdate }) => {
  return (
    <Stack direction={'column'}>
      <MarkdownEditor
        id={field.id}
        title={field.title}
        groupScope={groupScope}
        rawContent={field.content}
        onChange={(newContent) => {
          if (newContent === field.content) return
          onUpdate(questionId, {
            ...field,
            content: newContent === '' ? undefined : newContent,
          })
        }}
      />
    </Stack>
  )
}

export default FieldEditor