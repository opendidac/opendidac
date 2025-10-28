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
 * - Works with server endpoint /api/[groupScope]/questions/tags
 */

import { useCallback, useMemo, useState, useTransition } from 'react'
import useSWR from 'swr'
import { Chip, Stack, TextField } from '@mui/material'
import Loading from '../feedback/Loading'
import { fetcher } from '../../code/utils'

/**
 * TagsSelector (optimized)
 * - Displays top-N tags by usage.
 * - Allows temporary expansion for searching.
 * - Resets to compact mode after any selection.
 */
const TagsSelector = ({ groupScope, value = [], onChange, limit = 10 }) => {
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const selectedCsv = useMemo(() => value.join(','), [value])

  const { data: popular = [], error } = useSWR(
    groupScope
      ? `/api/${groupScope}/questions/tags?selected=${encodeURIComponent(selectedCsv)}`
      : null,
    fetcher,
    { keepPreviousData: true },
  )

  /** --- Derived data --- */
  const { selectedItems, visibleNonSelected, hasMore } = useMemo(() => {
    const selectedSet = new Set(value)
    const selectedItems = popular.filter(({ label }) => selectedSet.has(label))
    const nonSelected = popular.filter(({ label }) => !selectedSet.has(label))

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
  }, [popular, expanded, search, value, limit])

  /** --- Handlers --- */
  const handleToggle = useCallback(
    (label) => {
      const isSelected = value.includes(label)
      const next = isSelected
        ? value.filter((t) => t !== label)
        : [...value, label]

      // Use transition to keep UI responsive during revalidation
      startTransition(() => onChange?.(next))

      // Reset discovery mode
      setExpanded(false)
      setSearch('')
    },
    [value, onChange],
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
    <Loading loading={!popular.length && !error} errors={[error]}>
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

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          justifyContent="flex-start"
        >
          {allTags.map(({ label }) => {
            const selected = value.includes(label)
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
      </Stack>
    </Loading>
  )
}

export default TagsSelector
