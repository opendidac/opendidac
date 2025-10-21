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
import { Stack, MenuItem, Box } from '@mui/material'
import { useInput } from '@/code/useInput'
import DropDown from './DropDown'
import { useEffect } from 'react'

const DurationPicker = ({ value, disabled = false, onChange }) => {
  const { value: hours, setValue: setHours } = useInput(value?.hours || 0)
  const { value: minutes, setValue: setMinutes } = useInput(value?.minutes || 0)

  useEffect(() => {
    setHours(value?.hours || 0)
    setMinutes(value?.minutes || 0)
  }, [value, setHours, setMinutes])

  return (
    <Box sx={{ width: '150px' }}>
      <Stack direction="row" spacing={2}>
        <DropDown
          id={'hours'}
          name={'Hours'}
          disabled={disabled}
          defaultValue={hours}
          onChange={(value) => {
            setHours(value)
            onChange({ hours: value, minutes })
          }}
          minWidth={'70px'}
        >
          {[...Array(24).keys()].map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </DropDown>
        <DropDown
          id={'minutes'}
          name={'Minutes'}
          disabled={disabled}
          defaultValue={minutes}
          onChange={(value) => {
            setMinutes(value)
            onChange({ hours, minutes: value })
          }}
          minWidth={'80px'}
        >
          {[...Array(60 / 5).keys()].map((item) => (
            <MenuItem key={item * 5} value={item * 5}>
              {item * 5}
            </MenuItem>
          ))}
        </DropDown>
      </Stack>
    </Box>
  )
}

export default DurationPicker
