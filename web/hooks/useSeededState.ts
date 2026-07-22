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

import { useEffect, useState, useEffectEvent } from 'react'
import type { Dispatch, SetStateAction } from 'react'

/**
 * useState that re-seeds from `seed` ONLY when `key` changes.
 *
 * Same-key `seed` changes are ignored by design: an async refetch (SWR
 * revalidation) can never clobber what the user is typing. The key must
 * therefore encode EVERY identity whose change should reload the content
 * (file id, question id, participant id, discard counter, ...).
 */
export function useSeededState<T>(
  seed: T,
  key: React.Key,
): [T, Dispatch<SetStateAction<T>>] {
  const getSeed = useEffectEvent(() => seed)
  const [value, setValue] = useState<T>(seed)

  useEffect(() => {
    setValue(getSeed())
    // getSeed is an effect event — stable, must not be a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, setValue]
}
