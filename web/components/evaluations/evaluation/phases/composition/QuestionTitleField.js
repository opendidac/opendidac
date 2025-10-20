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
import { useCallback } from 'react'
import { TextField, Typography } from '@mui/material'
import useCtrlState from '@/hooks/useCtrlState'

const QuestionTitleField = ({
  id,
  currentTitle,
  originalTitle,
  readOnly = false,
  onChangeTitle,
}) => {
  const [localTitle, setLocalTitle] = useCtrlState(currentTitle, id)

  const handleTitleChange = useCallback(
    (value) => {
      setLocalTitle(value)
      onChangeTitle(value)
    },
    [onChangeTitle, setLocalTitle],
  )

  if (readOnly) {
    return <Typography variant="body2">{currentTitle}</Typography>
  }

  const isTitleChanged = localTitle !== originalTitle
  return (
    <TextField
      variant="standard"
      size="small"
      label={isTitleChanged ? originalTitle : null}
      value={localTitle}
      onChange={(event) => handleTitleChange(event.target.value)}
      sx={{
        flexGrow: 1,
        '& .MuiInput-underline:before': {
          borderBottomColor: 'transparent',
        },
        '& .MuiInput-underline:hover:before': {
          borderBottomColor: 'rgba(0, 0, 0, 0.42)',
        },
        '& .MuiInput-underline:after': {
          borderBottomColor: 'rgba(0, 0, 0, 0.42)',
        },
        '& .MuiInputBase-input': {
          padding: '4px 0',
        },
      }}
    />
  )
}

export default QuestionTitleField
