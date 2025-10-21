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
import { Box, Stack, Typography } from '@mui/material'
import RadioViewer from '@/components/input/RadioViewer'

const CompareTrueFalse = ({ mode, solution, answer }) => {
  return (
    <Stack direction="row" spacing={2} padding={2} alignItems="center">
      <RadioViewer
        mode={mode}
        round
        isCorrect={solution === true}
        isFilled={answer === true}
      />
      <Box>
        <Typography variant="body1">True</Typography>
      </Box>
      <RadioViewer
        mode={mode}
        round
        isCorrect={solution === false}
        isFilled={answer === false}
      />
      <Box>
        <Typography variant="body1">False</Typography>
      </Box>
    </Stack>
  )
}

export default CompareTrueFalse
