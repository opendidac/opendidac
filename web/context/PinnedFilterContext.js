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

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from 'react'

const PinnedFilterContext = createContext({
  pinnedFilter: '',
  setPinnedFilter: () => {},
})

export function PinnedFilterProvider({ children }) {
  // Load initial value from localStorage, or use empty object
  const [pinnedFilter, setPinnedFilterState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pinnedFilter')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          return {}
        }
      }
    }
    return {}
  })

  // Listen for storage events to sync pinnedFilter across tabs
  React.useEffect(() => {
    function handleStorage(event) {
      if (event.key === 'pinnedFilter') {
        if (event.newValue) {
          try {
            setPinnedFilterState(JSON.parse(event.newValue))
          } catch {
            console.error('Failed to parse pinnedFilter from storage event: ', event.newValue)
          }
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Memoize setPinnedFilter to avoid unnecessary re-renders
  const setPinnedFilter = useCallback((newFilter) => {
    setPinnedFilterState(newFilter)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pinnedFilter', JSON.stringify(newFilter))
    }
  }, [])

  const value = useMemo(() => ({ pinnedFilter, setPinnedFilter }), [pinnedFilter, setPinnedFilter])

  return (
    <PinnedFilterContext.Provider value={value}>
      {children}
    </PinnedFilterContext.Provider>
  )
}

export function usePinnedFilter() {
  return useContext(PinnedFilterContext)
}
