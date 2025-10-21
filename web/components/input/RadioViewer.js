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
import CheckIcon from '@mui/icons-material/Check'
import ClearIcon from '@mui/icons-material/Clear'
import { Stack } from '@mui/material'

/*

  Possible cases:
  - isCorrect = true, isFilled = false - The option is correct but the users didn't select it
  - isCorrect = false, isFilled = true - The option is incorrect but the users selected it
  - isCorrect = false, isFilled = false - The option is incorrect and the users didn't select it - ok
  - isCorrect = true, isFilled = true - The option is correct and the users selected it - ok

*/

const RadioViewer = ({ round, mode, isCorrect, isFilled }) => {
  const getIndicator = (mode, isFilled, isCorrect, size = 20) => {
    if (mode === 'consult')
      return (
        <ClearIcon sx={{ color: `info.main`, width: size, height: size }} />
      )

    if (isFilled && isCorrect)
      return (
        <CheckIcon sx={{ color: `success.main`, width: size, height: size }} />
      )
    if (isFilled && !isCorrect)
      return (
        <ClearIcon sx={{ color: `error.main`, width: size, height: size }} />
      )
  }

  const getBorderColor = (mode, isFilled, isCorrect) => {
    if (mode === 'consult') return `info.main`

    if (isFilled && isCorrect) return `success.main`
    if (isFilled && !isCorrect) return `error.main`
    if (isCorrect && !isFilled) return `error.main`
    return `grey.400`
  }

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        border: '1px solid',
        borderColor: getBorderColor(mode, isFilled, isCorrect),
        borderRadius: round ? '50%' : 2,
        p: 0.6,
      }}
    >
      <Stack alignItems="center" justifyContent="center" width={20} height={20}>
        {isFilled && getIndicator(mode, isFilled, isCorrect)}
      </Stack>
    </Stack>
  )
}
export default RadioViewer
