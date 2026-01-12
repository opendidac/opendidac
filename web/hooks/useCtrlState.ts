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

import { useEffect, useRef, useState, useEffectEvent } from 'react'

export function useCtrlState<T>(initialValue: T, key: React.Key) {
  const getInitial = useEffectEvent(() => initialValue)

  const ref = useRef<T>(initialValue)
  const [state, _setState] = useState<T>(initialValue)

  // Reset ONLY when key changes
  useEffect(() => {
    const next = getInitial()
    ref.current = next
    _setState(next)
    // for some reason, we still must ignore missing getInitial warning in dependencies.
    // Based on the official react documentation, they do not need to be in the dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Monaco-safe: no rerender
  const setState = (next: T | ((prev: T) => T)) => {
    const prev = ref.current
    const value =
      typeof next === 'function' ? (next as (prev: T) => T)(prev) : next
    if (value === prev) return
    ref.current = value
  }

  // Controlled inputs: force rerender
  const setStateControlled = (next: T | ((prev: T) => T)) => {
    const prev = ref.current
    const value =
      typeof next === 'function' ? (next as (prev: T) => T)(prev) : next
    if (value === prev) return
    ref.current = value
    _setState(value)
  }

  return { state, setState, setStateControlled, get: () => ref.current }
}
