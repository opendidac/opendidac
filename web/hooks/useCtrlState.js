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

/**
 * useCtrlState is a hook that manages a sticky local draft per entity
 * the state refresh is managed by the key
 */

import { useState, useEffect } from 'react'

const useCtrlState = (initial, key) => {
  const [value, setValue] = useState(initial)

  useEffect(() => {
    //console.log('useCtrlState', key, initial, value)
    setValue(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, setValue]
}

export default useCtrlState
