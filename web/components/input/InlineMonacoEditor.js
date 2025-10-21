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
import { useState, useEffect, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { Stack } from '@mui/material'

const getContentHeight = (editor, minHeight = 100) =>
  Math.max(minHeight, editor.getModel().getLineCount() * 19 + 21)

const defaultOptions = {
  readOnly: false,
  minimap: { enabled: false },
  hideCursorInOverviewRuler: true,
  overviewRulerLanes: 0,
  scrollbar: {
    vertical: 'hidden',
    handleMouseWheel: false,
  },
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 4,
  //renderWhitespace: 'all',
}

const InlineMonacoEditor = ({
  code,
  language = 'javascript',
  readOnly = false,
  onChange,
  minHeight = 100,
  editorOptions = {},
}) => {
  const [editor, setEditor] = useState(null)
  const [contentHeight, setContentHeight] = useState(100)
  const editorMount = (editor, _monaco) => {
    setEditor(editor)
    setContentHeight(getContentHeight(editor, minHeight))
  }

  useEffect(() => {
    if (editor) {
      const newContentHeight = getContentHeight(editor, minHeight)
      editor.setScrollPosition({ scrollTop: 0 })
      setContentHeight(newContentHeight)
    }
  }, [code, editor, minHeight])

  const onContentChange = useCallback(
    (newContent) => {
      const newContentHeight = getContentHeight(editor, minHeight)
      setContentHeight(newContentHeight)
      editor.setScrollPosition({ scrollTop: 0 })
      onChange(newContent)
    },
    [editor, onChange, minHeight],
  )

  return (
    <Stack
      minHeight={contentHeight}
      height={contentHeight}
      width="100%"
      position="relative"
    >
      <Editor
        height={contentHeight}
        width="100%"
        language={language}
        value={code}
        options={{ ...defaultOptions, ...editorOptions, readOnly }}
        onChange={onContentChange}
        onMount={editorMount}
      />
    </Stack>
  )
}

export default InlineMonacoEditor
