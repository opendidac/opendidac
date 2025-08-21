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
import { MultiLineTextField } from '@/components/input/MultiLineTextFields'

const AnswerField = ({ fieldId, value, onValueChange }) => {
  return (
    <MultiLineTextField
      id={`answer-exact-match-${fieldId}`}
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
          onValueChange(fieldId, newValue)
        }
      }}
    />
  )
}

export default AnswerField
