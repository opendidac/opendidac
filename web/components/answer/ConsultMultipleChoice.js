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
import { Box, Stack, TextField } from '@mui/material'
import RadioViewer from '@/components/input/RadioViewer'
import MultipleChoiceConfig from './multipleChoice/MultipleChoiceConfig'
import { useMemo } from 'react'
import MarkdownViewer from '@/components/input/markdown/MarkdownViewer'
import { useTheme } from '@emotion/react'

const ConsultMultipleChoice = ({ multipleChoice, answer }) => {
  const radio = useMemo(
    () =>
      multipleChoice.activateSelectionLimit &&
      multipleChoice.selectionLimit === 1,
    [multipleChoice],
  )
  const theme = useTheme()

  return (
    <Box height={'100%'}>
      <Stack pt={2} px={1}>
        <MultipleChoiceConfig multipleChoice={multipleChoice} />
      </Stack>
      <Stack spacing={1} padding={2}>
        {multipleChoice.options?.map((option, index) => (
          <Stack
            key={index}
            direction="row"
            alignItems="flex-start"
            spacing={2}
            sx={{ flex: 1 }}
          >
            <RadioViewer
              mode={'consult'}
              key={index}
              round={radio}
              isCorrect={option.isCorrect}
              isFilled={answer.options.some((opt) => opt.id === option.id)}
            />
            <Stack flex={1} bgcolor={theme.palette.background.paper}>
              <MarkdownViewer
                content={option.text}
                bgColor={theme.palette.background.paper}
              />
            </Stack>
          </Stack>
        ))}
        {multipleChoice.activateStudentComment && (
          <TextField
            label={multipleChoice.studentCommentLabel || 'Comment'}
            multiline
            variant="standard"
            fullWidth
            value={answer.comment || ''}
          />
        )}
      </Stack>
    </Box>
  )
}

export default ConsultMultipleChoice
