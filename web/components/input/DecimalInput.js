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
import React, { useCallback, useEffect, useState } from 'react'
import TextField from '@mui/material/TextField'
import { InputAdornment, Typography } from '@mui/material'

// Regular expression to allow only numbers with up to 2 decimal places, including negatives
const regex = /^-?(\d+(\.\d{0,2})?|\.\d{0,2})$/

const DecimalInput = ({
  value: initial,
  onChange,
  min = -Infinity,
  max = Infinity,
  rightAdornement,
  leftAdornement,
  ...props
}) => {
  const [value, setValue] = useState(initial)
  const [errorMessage, setErrorMessage] = useState()

  useEffect(() => {
    setValue(initial)
  }, [initial])

  const handleChange = useCallback(
    (e) => {
      const inputValue = e.target.value
      setErrorMessage(undefined)
      // replace comma with dot
      setValue(inputValue.replace(',', '.')) // Update the state with whatever users types

      // Test the input value format
      if (
        inputValue === '' ||
        !regex.test(inputValue) ||
        inputValue[inputValue.length - 1] === '.'
      ) {
        setErrorMessage('Not a valid number')
        return
      }

      let floatValue = parseFloat(inputValue)

      // Value must be convertable to a float
      if (isNaN(floatValue)) {
        setErrorMessage('Not a valid number')
        return
      }

      // Value must be between min and max
      if (floatValue < min) {
        floatValue = min
        setValue(floatValue)
        onChange(floatValue)
        return
      }

      if (floatValue > max) {
        floatValue = max
        setValue(floatValue)
        onChange(floatValue)
        return
      }

      onChange(floatValue)
    },
    [min, max, onChange],
  )

  return (
    <TextField
      value={value}
      onChange={handleChange}
      type="text"
      error={Boolean(errorMessage)} // Display error if errorMessage exists
      helperText={errorMessage}
      InputProps={{
        inputMode: 'numeric',
        pattern: '^-?\\d*(\\.\\d{0,2})?$',
        endAdornment: (
          <InputAdornment position="end">
            <Typography variant={'caption'}>{rightAdornement}</Typography>
          </InputAdornment>
        ),
        startAdornment: leftAdornement && (
          <InputAdornment position="start">
            <Typography variant={'caption'}>{leftAdornement}</Typography>
          </InputAdornment>
        ),
      }}
      {...props}
    />
  )
}

export default DecimalInput
