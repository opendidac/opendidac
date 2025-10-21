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
import { useEffect, useState, useRef } from 'react'
import {
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  Box,
} from '@mui/material'
const DropDown = ({
  children,
  id,
  name,
  defaultValue,
  disabled = false,
  blurOnChange = false,
  minWidth = '120px',
  variant = 'filled',
  size = 'medium',
  icon,
  onChange,
  helperText,
}) => {
  const selectRef = useRef()

  const [value, setValue] = useState(defaultValue || '')
  const handleChange = (event) => {
    if (blurOnChange) {
      selectRef.current.blur()
    }
    setValue(event.target.value)
    onChange && onChange(event.target.value)
  }
  useEffect(() => {
    setValue(defaultValue)
    selectRef.current.value = defaultValue
  }, [defaultValue])

  return (
    <FormControl sx={{ flexGrow: 1, minWidth }} variant={variant} margin="none">
      <InputLabel id={`label-${id}`}>{name}</InputLabel>
      <Select
        ref={selectRef}
        labelId={`label-${id}`}
        id={id}
        size={size}
        autoWidth
        onChange={handleChange}
        inputProps={{ disabled: disabled }}
        value={value}
        MenuProps={{ variant: 'selectedMenu' }}
        sx={{ padding: 0 }}
        IconComponent={
          icon ? () => <Box sx={{ mr: 1, mt: 2.5 }}>{icon}</Box> : undefined
        }
      >
        {children}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}

export default DropDown
