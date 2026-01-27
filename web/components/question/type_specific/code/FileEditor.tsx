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

import React, { useMemo } from 'react'
import { Box, Stack, TextField, Typography } from '@mui/material'
import InlineMonacoEditor from '../../../input/InlineMonacoEditor'
import { useTheme, type Theme } from '@mui/material/styles'
import { languageBasedOnPathExtension } from '@/core/utils'
import { useCtrlState } from '@/hooks/useCtrlState'

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
  secondaryActions?: React.ReactNode
  leftCorner?: React.ReactNode
}

const FileEditor: React.FC<FileEditorProps> = ({
  file,
  readonlyPath = false,
  readonlyContent = false,
  onChange = () => {},
  secondaryActions,
  leftCorner,
}) => {
  const theme: Theme = useTheme()

  const { state: path, setStateControlled: setPath } = useCtrlState(
    file?.path ?? '',
    file?.id ?? 'no-file',
  )

  const { state: content, setState: setContent } = useCtrlState(
    file?.content ?? '',
    file?.id ?? 'no-file',
  )

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
                  if (file) onChange({ ...file, path: next })
                }}
              />
            )) || <Typography variant="body1">{path}</Typography>}
          </Box>
          {secondaryActions}
        </Stack>
      </Stack>

      <InlineMonacoEditor
        code={content}
        language={language}
        readOnly={readonlyContent}
        minHeight={100}
        onChange={(next: string) => {
          setContent(next)
          if (file) onChange({ ...file, content: next })
        }}
      />
    </Stack>
  )
}

export default FileEditor
