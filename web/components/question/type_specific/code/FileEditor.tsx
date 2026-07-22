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

import React, { useEffect, useMemo, useRef } from 'react'
import { Box, Stack, TextField, Typography } from '@mui/material'
import { useDebouncedCallback } from 'use-debounce'
import InlineMonacoEditor from '../../../input/InlineMonacoEditor'
import { useTheme, type Theme } from '@mui/material/styles'
import { languageBasedOnPathExtension } from '@/core/utils'
import { useSeededState } from '@/hooks/useSeededState'

type FileModel = {
  id: string
  path: string
  content: string
}

type FileEditorProps = {
  file?: FileModel | null
  readonlyPath?: boolean
  readonlyContent?: boolean
  onChange?: (file: FileModel) => void
  onSave?: (file: FileModel) => void
  secondaryActions?: React.ReactNode
  leftCorner?: React.ReactNode
}

const FileEditor: React.FC<FileEditorProps> = ({
  file,
  readonlyPath = false,
  readonlyContent = false,
  onChange = () => {},
  onSave,
  secondaryActions,
  leftCorner,
}) => {
  const theme: Theme = useTheme()

  const contentKey = file?.id ?? file?.path ?? 'no-file'

  // Live local state: `language` below derives from the path while typing.
  const [path, setPath] = useSeededState(file?.path ?? '', contentKey)

  // Only fields the user touched: keeps save payloads consistent when path
  // and content are edited in quick succession before a refetch lands.
  const edits = useRef<{ path?: string; content?: string }>({})
  useEffect(() => {
    edits.current = {}
  }, [contentKey])

  const buildFile = (): FileModel | null =>
    file
      ? {
          ...file,
          path: edits.current.path ?? file.path,
          content: edits.current.content ?? file.content,
        }
      : null

  // Each file owns its debounced save, flushed on unmount: a debouncer
  // shared across a file list drops file A's save when file B is edited
  // within the debounce window.
  const debouncedSave = useDebouncedCallback((f: FileModel) => {
    onSave?.(f)
  }, 500)

  useEffect(() => {
    return () => {
      debouncedSave.flush()
    }
  }, [debouncedSave])

  const language = useMemo(
    () => languageBasedOnPathExtension(path) || 'text',
    [path],
  )

  if (!file) return null

  return (
    <Stack position="relative">
      <Stack
        direction="row"
        position="sticky"
        top={0}
        alignItems="center"
        justifyContent="center"
        zIndex={1}
        bgcolor={theme.palette.background.paper}
      >
        <Stack
          height={50}
          direction="row"
          alignItems="center"
          spacing={1}
          width="100%"
        >
          {leftCorner && <Box pl={2}>{leftCorner}</Box>}
          <Box flex={1} pl={1}>
            {(!readonlyPath && (
              <TextField
                variant="standard"
                label={`Path [syntax: ${language}]`}
                value={path}
                fullWidth
                onChange={(e) => {
                  const next = e.target.value
                  setPath(next)
                  edits.current.path = next
                  const newFile = buildFile()
                  if (newFile) {
                    onChange(newFile)
                    debouncedSave(newFile)
                  }
                }}
              />
            )) || <Typography variant="body1">{path}</Typography>}
          </Box>
          {secondaryActions}
        </Stack>
      </Stack>

      <InlineMonacoEditor
        contentKey={`file-content:${contentKey}`}
        defaultValue={file?.content ?? ''}
        language={language}
        readOnly={readonlyContent}
        minHeight={100}
        onChange={(next: string) => {
          edits.current.content = next
          const newFile = buildFile()
          if (newFile) {
            onChange(newFile)
            debouncedSave(newFile)
          }
        }}
      />
    </Stack>
  )
}

export default FileEditor
