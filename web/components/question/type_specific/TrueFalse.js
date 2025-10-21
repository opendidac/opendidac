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
import { useState, useEffect } from 'react'
import { Stack, Box, ToggleButton, Typography } from '@mui/material'

import CheckIcon from '@mui/icons-material/Check'
import ClearIcon from '@mui/icons-material/Clear'

const TrueFalse = ({
  id = 'true_false',
  isTrue: initial,
  onChange,
  allowUndefined = false,
}) => {
  const [isTrue, setIsTrue] = useState(initial)

  useEffect(() => {
    setIsTrue(initial)
  }, [initial, id])

  return (
    <Stack
      id={id}
      direction="row"
      justifyContent="flex-start"
      alignItems="center"
      spacing={2}
      padding={2}
    >
      <ToggleButton
        value="isTrue"
        selected={isTrue === true}
        color="success"
        size="small"
        sx={{
          borderRadius: '50%',
        }}
        onChange={() => {
          let newValue =
            isTrue === true ? (allowUndefined ? undefined : isTrue) : true
          setIsTrue(newValue)
          onChange(newValue)
        }}
      >
        {isTrue === true ? <CheckIcon /> : <ClearIcon />}
      </ToggleButton>
      <Box>
        <Typography variant="body1">True</Typography>
      </Box>

      <ToggleButton
        value="isTrue"
        selected={isTrue === false}
        color="success"
        size="small"
        sx={{
          borderRadius: '50%',
        }}
        onChange={() => {
          let newValue =
            isTrue === false ? (allowUndefined ? undefined : isTrue) : false
          setIsTrue(newValue)
          onChange(newValue)
        }}
      >
        {isTrue === false ? <CheckIcon /> : <ClearIcon />}
      </ToggleButton>
      <Box>
        <Typography variant="body1">False</Typography>
      </Box>
    </Stack>
  )
}

export default TrueFalse
