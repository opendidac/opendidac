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
import { Checkbox, Stack, Typography } from '@mui/material'
import { useCallback } from 'react'

const CheckboxLabel = ({
  label,
  checked,
  disabled = false,
  color = 'info',
  intermediate = undefined,
  onChange,
}) => {
  const setToggleCheckBox = useCallback(
    () => onChange && onChange(!checked),
    [onChange, checked],
  )
  return (
    <Stack
      direction="row"
      alignItems="center"
      onClick={setToggleCheckBox}
      sx={{ cursor: 'pointer' }}
    >
      <Checkbox
        size={'small'}
        checked={checked}
        indeterminate={intermediate}
        color={color}
        disabled={disabled}
        sx={{
          padding: '4px',
        }}
        onChange={(e) => onChange(e.target.checked)}
      />
      <Typography variant="caption" color="info">
        {' '}
        {label}{' '}
      </Typography>
    </Stack>
  )
}

export default CheckboxLabel
