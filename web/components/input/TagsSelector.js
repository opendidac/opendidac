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

import { useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { Chip, Stack } from '@mui/material'
import Loading from '../feedback/Loading'
import { fetcher } from '../../code/utils'

const TagsSelector = ({ groupScope, value = [], onChange, limit = 10 }) => {
  const selectedCsv = useMemo(() => value.join(','), [value])

  const { data: popular, error } = useSWR(
    groupScope
      ? `/api/${groupScope}/questions/tags?selected=${encodeURIComponent(selectedCsv)}`
      : null,
    groupScope ? fetcher : null,
    { fallbackData: [] },
  )

  const handleToggle = useCallback(
    (label) => {
      const isSelected = value.includes(label)
      const next = isSelected
        ? value.filter((t) => t !== label)
        : [...value, label]
      onChange && onChange(next)
    },
    [value, onChange],
  )

  return (
    <Loading loading={!popular} errors={[error]}>
      <Stack spacing={1}>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap={'wrap'}
          justifyContent={'flex-start'}
        >
          {popular?.slice(0, limit).map(({ label, count }) => {
            const selected = value.includes(label)
            return (
              <Chip
                key={label}
                label={`${label} (${count})`}
                color={selected ? 'info' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                onClick={() => handleToggle(label)}
                size="small"
              />
            )
          })}
        </Stack>
      </Stack>
    </Loading>
  )
}

export default TagsSelector
