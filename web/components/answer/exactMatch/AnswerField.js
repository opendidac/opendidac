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
import { TextField } from '@mui/material'
import { styled } from '@mui/system'

// Styled component to apply whitespace visibility
const MultiLineTextField = styled(TextField)({
  '& textarea': {
    whiteSpace: 'pre-wrap', // Preserves whitespaces and wraps text
  },
})
// TODO factorize this monospacetextfield.

const AnswerField = ({ index, value, onValueChange }) => {
  return (
    <MultiLineTextField
      id={`answer-exact-match-${index}`}
      variant="filled"
      label="Answer"
      value={value}
      multiline
      fullWidth
      helperText="Supports multiple lines. Careful with whitespaces."
      error={value === '' || value === undefined || value === null}
      onChange={(e) => {
        const newValue = e.target.value
        if (newValue !== value) {
          onValueChange(index, newValue)
        }
      }}
    />
  )
}

export default AnswerField
