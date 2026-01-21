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

import { useState, useRef, useEffect } from 'react'
import { TextField, Stack } from '@mui/material'

const PinInput = ({ value, onChange, error, disabled, autoFocus = false }) => {
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])

  // Initialize pin from value prop
  useEffect(() => {
    if (value) {
      const pinArray = value.split('').slice(0, 6)
      const newPin = [...pinArray, ...Array(6 - pinArray.length).fill('')]
      setPin(newPin)
    } else {
      setPin(['', '', '', '', '', ''])
    }
  }, [value])

  // Focus first input on mount if autoFocus
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  const handleChange = (index, newValue) => {
    // Only allow alphanumeric characters
    const filteredValue = newValue.toUpperCase().replace(/[^A-Z0-9]/g, '')

    if (filteredValue.length > 1) {
      // Handle paste: fill multiple fields
      const pasteData = filteredValue.slice(0, 6)
      const newPin = [...pin]

      for (let i = 0; i < pasteData.length && index + i < 6; i++) {
        newPin[index + i] = pasteData[i]
      }

      setPin(newPin)
      onChange(newPin.join(''))

      // Focus the next empty field or the last field
      const nextEmptyIndex = newPin.findIndex(
        (val, idx) => idx >= index && val === '',
      )
      const focusIndex =
        nextEmptyIndex !== -1
          ? nextEmptyIndex
          : Math.min(index + pasteData.length, 5)
      if (inputRefs.current[focusIndex]) {
        inputRefs.current[focusIndex].focus()
      }
      return
    }

    // Single character input
    const newPin = [...pin]
    newPin[index] = filteredValue
    setPin(newPin)
    onChange(newPin.join(''))

    // Auto-advance to next field
    if (filteredValue && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        // If current field is empty, go to previous field and clear it
        const newPin = [...pin]
        newPin[index - 1] = ''
        setPin(newPin)
        onChange(newPin.join(''))
        inputRefs.current[index - 1]?.focus()
      } else if (pin[index]) {
        // If current field has value, clear it
        const newPin = [...pin]
        newPin[index] = ''
        setPin(newPin)
        onChange(newPin.join(''))
      }
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    // Prevent non-alphanumeric characters
    else if (e.key.length === 1 && !/^[A-Z0-9]$/i.test(e.key)) {
      e.preventDefault()
    }
  }

  const handlePaste = (index, e) => {
    e.preventDefault()
    const pastedData = e.clipboardData
      .getData('text')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')

    if (pastedData.length > 0) {
      const newPin = [...pin]
      const pasteLength = Math.min(pastedData.length, 6 - index)

      for (let i = 0; i < pasteLength; i++) {
        newPin[index + i] = pastedData[i]
      }

      setPin(newPin)
      onChange(newPin.join(''))

      // Focus the next empty field or the last field
      const nextEmptyIndex = newPin.findIndex(
        (val, idx) => idx >= index && val === '',
      )
      const focusIndex =
        nextEmptyIndex !== -1
          ? nextEmptyIndex
          : Math.min(index + pasteLength, 5)
      if (inputRefs.current[focusIndex]) {
        inputRefs.current[focusIndex].focus()
      }
    }
  }

  return (
    <Stack direction="row" spacing={1.5} justifyContent="center">
      {pin.map((char, index) => (
        <TextField
          key={index}
          inputRef={(el) => (inputRefs.current[index] = el)}
          value={char}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          inputProps={{
            maxLength: 1,
            style: {
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              padding: '12px 0',
            },
          }}
          error={error}
          disabled={disabled}
          variant="outlined"
          sx={{
            width: 56,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderWidth: 2,
              },
            },
          }}
        />
      ))}
    </Stack>
  )
}

export default PinInput
