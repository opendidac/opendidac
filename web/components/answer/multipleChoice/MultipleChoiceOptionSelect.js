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
import { Stack, ToggleButton } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import ClearIcon from '@mui/icons-material/Clear'
import MarkdownViewer from '@/components/input/markdown/MarkdownViewer'
import { useTheme } from '@emotion/react'

const MultipleChoiceOptionSelect = ({
  round = false,
  option,
  onSelect,
  disabled = false,
}) => {
  const theme = useTheme()

  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      spacing={2}
      sx={{
        flex: 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      onClick={(ev) => {
        if (!disabled) {
          ev.stopPropagation()
          onSelect(option.id)
        }
      }}
    >
      <ToggleButton
        value="correct"
        selected={option.isCorrect}
        size="small"
        color="success"
        onChange={(e) => {
          if (!disabled) {
            e.stopPropagation()
            onSelect(option.id)
          }
        }}
        disabled={disabled}
        sx={
          round
            ? {
                borderRadius: '50%',
              }
            : {}
        }
      >
        {option.isCorrect ? <CheckIcon /> : <ClearIcon />}
      </ToggleButton>

      <Stack flex={1} bgcolor={theme.palette.background.paper}>
        <MarkdownViewer
          content={option.text}
          bgColor={theme.palette.background.paper}
        />
      </Stack>
    </Stack>
  )
}

export default MultipleChoiceOptionSelect
