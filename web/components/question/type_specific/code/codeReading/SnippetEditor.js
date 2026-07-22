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

import React, { useEffect } from 'react'
import { Stack, Typography, IconButton } from '@mui/material'
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined'
import { useDebouncedCallback } from 'use-debounce'
import InlineMonacoEditor from '@/components/input/InlineMonacoEditor'
import outputEditorOptions from '@/components/question/type_specific/code/codeReading/outputEditorOptions.json'

const SnippetEditor = ({
  index,
  snippet,
  language,
  isOutputEditable,
  onSnippetChange,
  onOutputChange,
  onSave,
  onDelete,
}) => {
  // Each snippet owns its debounced save (same pattern as MultipleChoice
  // options): a debouncer shared across the list would drop snippet A's
  // save when snippet B is edited within the debounce window.
  const debouncedSave = useDebouncedCallback(onSave, 500)

  // Persist pending edits when the snippet unmounts (navigation).
  useEffect(() => {
    return () => {
      debouncedSave.flush()
    }
  }, [debouncedSave])

  return (
    <Stack direction={'column'} spacing={1}>
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

      {/* Code editor: seeded island, the parent mirrors changes */}
      <InlineMonacoEditor
        contentKey={`snippet-code:${snippet.id}`}
        defaultValue={snippet.snippet || ''}
        language={language}
        minHeight={60}
        onChange={(newCode) => {
          onSnippetChange(newCode)
          debouncedSave(snippet.id, {
            ...snippet,
            snippet: newCode,
            output: null,
          })
        }}
      />

      {/* Output editor: stays controlled — run results and code-edit
          clearing are pushed in programmatically via the parent state,
          which mirrors manual edits synchronously (no jump risk). */}
      <OutputEditor
        output={snippet.output || ''}
        isOutputEditable={isOutputEditable}
        onOutputChange={(newOutput) => {
          onOutputChange(newOutput)
          debouncedSave(snippet.id, { ...snippet, output: newOutput })
        }}
      />
    </Stack>
  )
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
