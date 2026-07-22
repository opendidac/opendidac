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
import { useSeededState } from '@/hooks/useSeededState'

/**
 * MUI TextField that owns its content (seeded input island).
 * `defaultValue` is applied at mount and whenever `contentKey` changes;
 * same-key updates are ignored, so async refetches cannot clobber typing.
 * The latest value flows out through onChange(string).
 */
const SeededTextField = ({
  contentKey,
  defaultValue = '',
  onChange,
  ...textFieldProps
}) => {
  const [value, setValue] = useSeededState(defaultValue, contentKey)

  return (
    <TextField
      {...textFieldProps}
      value={value}
      onChange={(e) => {
        setValue(e.target.value)
        onChange && onChange(e.target.value)
      }}
    />
  )
}

export default SeededTextField
