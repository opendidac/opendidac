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
 * Filtering-oriented TagsSelector
 * - Shows top N popular tags as chips in descending order of usage
 * - AND semantics: each selection refines the next suggestions
 * - Works with /api/[groupScope]/questions/tags
 */

import { useCallback, useMemo, useState, useTransition } from 'react'
import useSWR from 'swr'
import { Chip, Stack, TextField } from '@mui/material'
import Loading from '../feedback/Loading'
import { fetcher } from '../../code/utils'

/**
 * TagsSelector
 * - Displays top-N tags by usage.
 * - Reads tags directly from questionFilters.tags.
 * - Sends all current filters to /questions/tags for refined suggestions.
 */
const TagsSelector = ({
  groupScope,
  questionFilters,
  onChange,
  limit = 10,
}) => {
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const tags = useMemo(() => questionFilters?.tags ?? [], [questionFilters])

  // Build query string for all current filters
  const queryParams = useMemo(() => {
    return new URLSearchParams(questionFilters).toString()
  }, [questionFilters])

  // Fetch popular/refined tags from backend
  const shouldFetch = Boolean(groupScope && Object.keys(questionFilters).length)
  const {
    data: tagData,
    error,
    isLoading,
  } = useSWR(
    shouldFetch ? `/api/${groupScope}/questions/tags?${queryParams}` : null,
    fetcher,
    { keepPreviousData: true },
  )

  /** --- Derived data --- */
  const { selectedItems, visibleNonSelected, hasMore } = useMemo(() => {
    const list = tagData ?? []
    const selectedSet = new Set(tags)
    const selectedItems = list.filter(({ label }) => selectedSet.has(label))
    const nonSelected = list.filter(({ label }) => !selectedSet.has(label))

    const filteredNonSelected = expanded
      ? nonSelected.filter(({ label }) =>
          label.toLowerCase().includes(search.toLowerCase()),
        )
      : nonSelected.slice(0, limit)

    return {
      selectedItems,
      visibleNonSelected: filteredNonSelected,
      hasMore: !expanded && nonSelected.length > limit,
    }
  }, [tagData, expanded, search, tags, limit])

  /** --- Handlers --- */
  const handleToggle = useCallback(
    (label) => {
      const isSelected = tags.includes(label)
      const next = isSelected
        ? tags.filter((t) => t !== label)
        : [...tags, label]

      // Keep UI responsive
      startTransition(() => onChange?.(next))

      // Reset discovery state
      setExpanded(false)
      setSearch('')
    },
    [tags, onChange],
  )

  const handleExpand = useCallback(() => {
    setExpanded(true)
    setSearch('')
  }, [])

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value)
  }, [])

  /** --- Render --- */
  const allTags = useMemo(
    () => [...selectedItems, ...visibleNonSelected],
    [selectedItems, visibleNonSelected],
  )

  return (
    <Loading loading={isLoading} errors={[error]}>
      <Stack spacing={1}>
        {expanded && (
          <TextField
            size="small"
            placeholder="Search tags…"
            value={search}
            onChange={handleSearchChange}
            inputProps={{ 'aria-label': 'Search tags' }}
            autoFocus
          />
        )}

        {allTags.length === 0 && !isPending ? null : (
          <>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              justifyContent="flex-start"
            >
              {allTags.map(({ label }) => {
                const selected = tags.includes(label)
                return (
                  <Chip
                    key={label}
                    label={label}
                    color={selected ? 'info' : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    onClick={() => handleToggle(label)}
                    size="small"
                  />
                )
              })}

              {hasMore && (
                <Chip
                  key="load-more"
                  label="+"
                  color="default"
                  variant="outlined"
                  onClick={handleExpand}
                  size="small"
                  aria-label="Load more tags"
                />
              )}
            </Stack>

            {isPending && (
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Updating…</div>
            )}
          </>
        )}
      </Stack>
    </Loading>
  )
}

export default TagsSelector
