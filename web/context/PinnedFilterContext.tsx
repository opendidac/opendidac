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

import React, { createContext, useContext, useState, useCallback } from 'react'

type Filter = Record<string, any>

interface PinnedFilterContextType {
  getPinnedFilter: (groupId: string) => Filter | undefined
  setPinnedFilter: (groupId: string, filter: Filter | undefined) => void
}

const PinnedFilterContext = createContext<PinnedFilterContextType>({
  getPinnedFilter: () => undefined,
  setPinnedFilter: () => {},
})

export function PinnedFilterProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [pinnedFilters, setPinnedFiltersState] = useState<
    Record<string, Filter | undefined>
  >(() => {
    try {
      const stored = localStorage.getItem('pinnedFilters')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  React.useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key === 'pinnedFilters') {
        try {
          setPinnedFiltersState(
            event.newValue ? JSON.parse(event.newValue) : {},
          )
        } catch {
          console.error('Failed to parse pinnedFilters from storage')
        }
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const getPinnedFilter = useCallback(
    (groupId: string): Filter => pinnedFilters[groupId] || {},
    [pinnedFilters],
  )

  const setPinnedFilter = useCallback(
    (groupId: string, filter: Filter | undefined) => {
      const next: Record<string, Filter | undefined> = { ...pinnedFilters }

      if (filter === undefined) delete next[groupId]
      else next[groupId] = filter

      setPinnedFiltersState(next)
      localStorage.setItem('pinnedFilters', JSON.stringify(next))
    },
    [pinnedFilters],
  )

  return (
    <PinnedFilterContext.Provider value={{ getPinnedFilter, setPinnedFilter }}>
      {children}
    </PinnedFilterContext.Provider>
  )
}

export function usePinnedFilter() {
  return useContext(PinnedFilterContext)
}
