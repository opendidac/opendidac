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

import {
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
  AlertTitle,
} from '@mui/material'

import { useBottomPanel } from '@/context/BottomPanelContext'

import BottomPanelHeader from '@/components/layout/utils/BottomPanelHeader'
import BottomPanelContent from '@/components/layout/utils/BottomPanelContent'
import React, { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'

const ScratchPad = ({ content, onChange, readOnly }) => {
  const { toggleOpen } = useBottomPanel()

  const textAreaRef = useRef()

  const openScratchPad = () => {
    toggleOpen()
    if (!readOnly && textAreaRef && textAreaRef.current) {
      setTimeout(() => {
        textAreaRef.current.focus()
      }, 100)
    }
  }

  const [localContent, setLocalContent] = useState(content)

  const onContentChange = useCallback(
    (newContent) => {
      setLocalContent(newContent)
      onChange(newContent)
    },
    [onChange],
  )

  return (
    <Stack maxHeight={'calc(100% - 90px)'}>
      <BottomPanelHeader sx={{ cursor: 'pointer', pl: 1 }}>
        <Stack direction={'row'}>
          <Button
            color="info"
            startIcon={
              <Image
                alt="Scratch Pad"
                src="/svg/icons/update.svg"
                width="18"
                height="18"
              />
            }
            onClick={openScratchPad}
          >
            Scratch Pad
          </Button>
          <UserHelpPopper>
            <Alert severity="info">
              <AlertTitle>Professor-only Scratch Pad</AlertTitle>
              <Typography variant="body2">
                The content of the scratch pad will never be shared with
                students.
              </Typography>
              <Typography variant="body2">
                Use it to store private notes about this question.
              </Typography>
            </Alert>
          </UserHelpPopper>
        </Stack>
      </BottomPanelHeader>
      <BottomPanelContent sx={{ pl: 2 }}>
        {readOnly ? (
          <Typography
            variant="body1"
            sx={{
              borderRadius: 1,
              mb: 2,
              whiteSpace: 'pre-wrap',
              minHeight: '100px',
            }}
          >
            {localContent || 'No notes...'}
          </Typography>
        ) : (
          <TextField
            disabled={readOnly}
            inputRef={textAreaRef}
            multiline
            minRows={10}
            maxRows={20}
            fullWidth
            value={localContent}
            onChange={(e) => onContentChange(e.target.value)}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            placeholder={'Student-hidden notes...'}
            sx={{ backgroundColor: 'white', borderRadius: 1, p: 1, mb: 2 }}
          />
        )}
      </BottomPanelContent>
    </Stack>
  )
}

export default ScratchPad
