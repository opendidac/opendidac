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
import { useState, useEffect } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import { Stack } from '@mui/material'

const getContentHeight = (editor, minHeight = 100) => {
  const originalModel = editor.getOriginalEditor().getModel()
  const modifiedModel = editor.getModifiedEditor().getModel()
  const originalHeight = originalModel
    ? originalModel.getLineCount() * 19 + 21
    : minHeight
  const modifiedHeight = modifiedModel
    ? modifiedModel.getLineCount() * 19 + 21
    : minHeight
  return Math.max(minHeight, Math.max(originalHeight, modifiedHeight))
}

const defaultOptions = {
  readOnly: false,
  renderSideBySide: false,
  minimap: { enabled: false },
  hideCursorInOverviewRuler: true,
  overviewRulerLanes: 0,
  scrollbar: {
    vertical: 'hidden',
    handleMouseWheel: false,
  },
  lineDecorationsWidth: 8,
  lineNumbersMinChars: 4,
  // renderWhitespace: 'all',
}

const InlineDiffEditor = ({
  original,
  modified,
  language = 'javascript',
  readOnly = false,
  minHeight = 100,
  editorOptions = {},
}) => {
  const [editor, setEditor] = useState(null)
  const [contentHeight, setContentHeight] = useState(minHeight)

  const editorMount = (editor, _monaco) => {
    setEditor(editor)
    setContentHeight(getContentHeight(editor, minHeight))
  }

  useEffect(() => {
    if (editor) {
      const newContentHeight = getContentHeight(editor, minHeight)
      editor.getModifiedEditor().setScrollPosition({ scrollTop: 0 })
      setContentHeight(newContentHeight)
    }
  }, [original, modified, editor, minHeight])

  return (
    <Stack
      minHeight={contentHeight}
      height={contentHeight}
      width="100%"
      position="relative"
    >
      <DiffEditor
        height={contentHeight}
        width="100%"
        original={original}
        modified={modified}
        language={language}
        options={{ ...defaultOptions, ...editorOptions, readOnly }}
        onMount={editorMount}
      />
    </Stack>
  )
}

export default InlineDiffEditor
