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

import { renderHook, act } from '@testing-library/react'
import { useSeededState } from './useSeededState'

describe('useSeededState', () => {
  it('seeds from the initial value', () => {
    const { result } = renderHook(() => useSeededState('hello', 'k1'))
    expect(result.current[0]).toBe('hello')
  })

  it('updates via the setter like useState', () => {
    const { result } = renderHook(() => useSeededState('a', 'k1'))
    act(() => result.current[1]('b'))
    expect(result.current[0]).toBe('b')
    act(() => result.current[1]((prev) => prev + 'c'))
    expect(result.current[0]).toBe('bc')
  })

  it('ignores seed changes while the key is unchanged', () => {
    const { result, rerender } = renderHook(
      ({ seed, k }) => useSeededState(seed, k),
      { initialProps: { seed: 'typed', k: 'k1' } },
    )
    act(() => result.current[1]('user input'))
    rerender({ seed: 'server refetch', k: 'k1' })
    expect(result.current[0]).toBe('user input')
  })

  it('re-seeds with the latest seed when the key changes', () => {
    const { result, rerender } = renderHook(
      ({ seed, k }) => useSeededState(seed, k),
      { initialProps: { seed: 'file A', k: 'a' } },
    )
    act(() => result.current[1]('edited A'))
    rerender({ seed: 'file B', k: 'b' })
    expect(result.current[0]).toBe('file B')
  })
})
