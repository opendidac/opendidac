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
import { Stack, Typography, TextField, Tooltip, Button } from '@mui/material'

import { useSnackbar } from '@/context/SnackbarContext'
import { useBottomPanel } from '@/context/BottomPanelContext'

import BottomPanelHeader from '@/components/layout/utils/BottomPanelHeader'
import BottomPanelContent from '@/components/layout/utils/BottomPanelContent'
import { useRef } from 'react'
import Image from 'next/image'

const ScratchPad = ({ content, onChange }) => {
  const { show: showSnackbar } = useSnackbar()

  const { toggleOpen } = useBottomPanel()

  const textAreaRef = useRef()

  const openScratchPad = () => {
    toggleOpen()
    setTimeout(() => {
      textAreaRef.current.focus()
    }, 100);
  }

  return (
    <Stack maxHeight={'calc(100% - 90px)'}>
      <BottomPanelHeader sx={{ cursor: 'pointer', pl: 1 }}>
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
      </BottomPanelHeader>
      <BottomPanelContent sx={{ pl: 2 }}>
        <Typography sx={{ pb: 2 }} variant="body2" color="textSecondary">
          This field will never be shown to students. Use it to store notes about this question.
          { /* TODO make this a small "i" next to the scratch pad button instead of an always-visible text */ }
        </Typography>
        <TextField
          inputRef={textAreaRef}
          multiline
          minRows={10}
          maxRows={20}
          fullWidth
          value={content}
          // onChange={(e) => onChange(e.target.value)}
          variant="standard"
          InputProps={{ disableUnderline: true }}
          placeholder={"Student-hidden notes..."}
          // background color white
          sx={{ backgroundColor: 'white', borderRadius: 1, p: 1, mb: 2 }}
        />
      </BottomPanelContent>
    </Stack>
  )
}

export default ScratchPad
