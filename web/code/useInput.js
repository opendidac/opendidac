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
import { useState } from 'react'

/*
    input hook to be used on all input fields to keep track of state
    for example see the usage in : layout/SignInSide.js
*/

const useInput = (data) => {
  const [value, setValue] = useState(data)
  const [error, setError] = useState({
    error: false,
    helperText: '',
  })

  return {
    value,
    setValue,
    setError,
    reset: () => setValue(''),
    bind: {
      value,
      ...error,
      onChange: (event) => {
        setValue(event.target.value)
        setError({ error: false })
      },
    },
  }
}

export { useInput }
