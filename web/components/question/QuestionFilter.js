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

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Tooltip,
} from '@mui/material'
import PushPinIcon from '@mui/icons-material/PushPin'
import UndoIcon from '@mui/icons-material/Undo'
import ClearIcon from '@mui/icons-material/Clear'

import { toArray as typesToArray } from './types.js'
import languages from '../../core/languages.json'
import TagsSelector from '../input/TagsSelector'
import CheckboxLabel from '../input/CheckboxLabel.js'
import { QuestionStatus } from '@prisma/client'
import { usePinnedFilter } from '@/context/PinnedFilterContext'
import { useDebouncedCallback } from 'use-debounce'

const environments = languages.environments
const types = typesToArray()

const initialFilters = {
  search: '',
  tags: [],
  questionStatus: QuestionStatus.ACTIVE,
  questionTypes: types
    .map((type) => type.value)
    .reduce((obj, type) => ({ ...obj, [type]: true }), {}),
  codeLanguages: environments
    .map((language) => language.language)
    .reduce((obj, language) => ({ ...obj, [language]: true }), {}),
  unused: false,
}

// Internally, we use a more detailed object format for managing filters.
const detailedToSimpleFilter = (detailedFilter) => {
  const simpleFilter = { ...detailedFilter }
  simpleFilter.questionTypes = Object.keys(simpleFilter.questionTypes).filter(
    (key) => simpleFilter.questionTypes[key],
  )
  if (!detailedFilter.questionTypes.code) {
    delete simpleFilter.codeLanguages
  }
  if (simpleFilter.codeLanguages) {
    simpleFilter.codeLanguages = Object.keys(simpleFilter.codeLanguages).filter(
      (key) => simpleFilter.codeLanguages[key],
    )
  }
  simpleFilter.questionStatus = detailedFilter.questionStatus
  if (!detailedFilter.unused) {
    delete simpleFilter.unused
  }
  return simpleFilter
}

const simpleToDetailedFilter = (simpleFilter) => {
  // Build the detailed filter based on the simple filter
  const detailedFilter = {
    search: simpleFilter.search || initialFilters.search,
    tags: simpleFilter.tags || initialFilters.tags,
    questionStatus:
      simpleFilter.questionStatus || initialFilters.questionStatus,
    questionTypes: { ...initialFilters.questionTypes },
    codeLanguages: { ...initialFilters.codeLanguages },
    unused: simpleFilter.unused || initialFilters.unused,
  }

  if (simpleFilter.questionTypes) {
    // set all questionTypes to false
    Object.keys(detailedFilter.questionTypes).forEach((type) => {
      detailedFilter.questionTypes[type] = false
    })

    // Update questionTypes and codeLanguages based on the simple filter
    simpleFilter.questionTypes.forEach((type) => {
      if (detailedFilter.questionTypes.hasOwnProperty(type)) {
        detailedFilter.questionTypes[type] = true
      }
    })
  }

  // Update codeLanguages based on the simple filter
  if (simpleFilter.codeLanguages) {
    // set all codeLanguages to false
    Object.keys(detailedFilter.codeLanguages).forEach((language) => {
      detailedFilter.codeLanguages[language] = false
    })

    // Update codeLanguages based on the simple filter
    simpleFilter.codeLanguages.forEach((language) => {
      if (detailedFilter.codeLanguages.hasOwnProperty(language)) {
        detailedFilter.codeLanguages[language] = true
      }
    })
  }

  return detailedFilter
}

import { useRouter } from 'next/router'

const QuestionFilter = ({ filters: initial, onApplyFilter, groupId }) => {
  const router = useRouter()
  const { groupScope } = router.query

  // Pinned filter from context
  const { getPinnedFilter, setPinnedFilter } = usePinnedFilter()

  const detailedPinnedFilter = useMemo(
    () => simpleToDetailedFilter(getPinnedFilter(groupId)),
    [getPinnedFilter, groupId],
  )

  const hasPinnedFilter = useMemo(() => {
    const pinned = getPinnedFilter(groupId)
    return pinned && Object.keys(pinned).length > 0
  }, [groupId, getPinnedFilter])

  // Local filter state
  const [detailedFilter, setDetailedFilter] = useState(
    simpleToDetailedFilter(initial),
  )

  useEffect(() => {
    setDetailedFilter(simpleToDetailedFilter(initial))
  }, [initial])

  const updateFilter = useCallback(
    (key, value) => {
      const newFilter = { ...detailedFilter, [key]: value }
      setDetailedFilter(newFilter)
    },
    [detailedFilter],
  )

  const filterDiffersFromPinned = useMemo(() => {
    // Compare each filter field with its initial value
    return (
      detailedFilter.search !== detailedPinnedFilter.search ||
      JSON.stringify(detailedFilter.tags) !==
        JSON.stringify(detailedPinnedFilter.tags) ||
      detailedFilter.questionStatus !== detailedPinnedFilter.questionStatus ||
      JSON.stringify(detailedFilter.questionTypes) !==
        JSON.stringify(detailedPinnedFilter.questionTypes) ||
      JSON.stringify(detailedFilter.codeLanguages) !==
        JSON.stringify(detailedPinnedFilter.codeLanguages) ||
      detailedFilter.unused !== detailedPinnedFilter.unused
    )
  }, [detailedPinnedFilter, detailedFilter])

  // Applying the filter
  const debouncedOnApplyFilter = useDebouncedCallback(async (newFilter) => {
    if (onApplyFilter) {
      const cleaned = detailedToSimpleFilter(newFilter)
      onApplyFilter(cleaned)
    }
  }, 300)

  useEffect(() => {
    debouncedOnApplyFilter(detailedFilter)
  }, [detailedFilter, debouncedOnApplyFilter])

  // Handlers for three buttons: Pin, Clear, Reset
  const handlePin = useCallback(() => {
    setPinnedFilter(groupId, detailedToSimpleFilter(detailedFilter))
  }, [groupId, detailedFilter, setPinnedFilter])

  const handleClear = useCallback(() => {
    setDetailedFilter(simpleToDetailedFilter(initial))
  }, [initial])

  const handleReset = useCallback(() => {
    setPinnedFilter(groupId, undefined)
  }, [groupId, setPinnedFilter])

  return (
    <form>
      <Stack spacing={2} padding={2}>
        <TextField
          label={'Search'}
          variant="outlined"
          fullWidth
          color="info"
          size="small"
          value={detailedFilter.search}
          onChange={(e) => updateFilter('search', e.target.value)}
        />

        <TagsSelector
          groupScope={groupScope}
          questionFilters={detailedToSimpleFilter(detailedFilter)}
          onChange={(tags) => updateFilter('tags', tags)}
        />

        <Stack direction="row" justifyContent="flex-start">
          <RadioGroup
            row
            value={detailedFilter.questionStatus}
            onChange={(e) => updateFilter('questionStatus', e.target.value)}
            aria-label="question status"
            sx={{ pl: 0.5 }}
          >
            <FormControlLabel
              value={QuestionStatus.ACTIVE}
              control={<Radio color="info" size="small" />}
              label={
                <Typography variant="caption" color="info">
                  Active
                </Typography>
              }
            />
            <FormControlLabel
              value={QuestionStatus.ARCHIVED}
              control={<Radio color="info" size="small" />}
              label={
                <Typography variant="caption" color="info">
                  Archived
                </Typography>
              }
            />
          </RadioGroup>
        </Stack>

        <CheckboxLabel
          label="Show only unused questions"
          checked={detailedFilter.unused}
          onChange={(checked) => updateFilter('unused', checked)}
          color="info"
        />

        <QuestionTypeSelection
          filter={detailedFilter}
          updateFilter={updateFilter}
        />
        <LanguageSelection
          filter={detailedFilter}
          updateFilter={updateFilter}
        />
        <Stack direction={'row'} spacing={2} width="100%">
          {filterDiffersFromPinned && (
            <Tooltip
              title={
                hasPinnedFilter
                  ? 'Revert to pinned filters.'
                  : 'Revert to default filters.'
              }
              enterDelay={500}
            >
              <Button
                variant="outlined"
                color="info"
                disabled={!filterDiffersFromPinned}
                onClick={handleClear}
                startIcon={<UndoIcon />}
                fullWidth
              >
                {' '}
                Revert{' '}
              </Button>
            </Tooltip>
          )}
          {filterDiffersFromPinned ? (
            <Tooltip
              title={`Persist current filters for subsequent visits.${hasPinnedFilter ? ' Will replace existing pinned filters.' : ''} New questions will inherit tags of pinned filters.`}
              enterDelay={500}
            >
              <Button
                variant="contained"
                color="info"
                startIcon={<PushPinIcon />}
                onClick={handlePin}
                fullWidth
              >
                {' '}
                Pin{' '}
              </Button>
            </Tooltip>
          ) : (
            hasPinnedFilter && (
              <Tooltip
                title="Remove pinned filters and revert back to default filters."
                enterDelay={500}
              >
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleReset}
                  fullWidth
                >
                  {' '}
                  Remove pin{' '}
                </Button>
              </Tooltip>
            )
          )}
        </Stack>
      </Stack>
    </form>
  )
}

const LanguageSelection = ({ filter, updateFilter }) => {
  const allLanguagesSelected = Object.values(filter.codeLanguages).every(
    Boolean,
  )
  const someLanguagesSelected = Object.values(filter.codeLanguages).some(
    Boolean,
  )

  const handleSelectLanguage = useCallback(
    (language) => {
      const newFilter = { ...filter.codeLanguages }
      // If all languages are selected, unselect all
      if (allLanguagesSelected) {
        Object.keys(newFilter).forEach((key) => {
          newFilter[key] = false
        })
        updateFilter('codeLanguages', newFilter)
      }

      newFilter[language] = !newFilter[language]

      const noLanguagesSelected = Object.values(newFilter).every(
        (value) => !value,
      )

      // If no languages are selected, select all
      if (noLanguagesSelected) {
        Object.keys(newFilter).forEach((key) => {
          newFilter[key] = true
        })
      }

      updateFilter('codeLanguages', newFilter)
    },
    [filter.codeLanguages, updateFilter, allLanguagesSelected],
  )

  const isIntermediate = someLanguagesSelected && !allLanguagesSelected
  const color = isIntermediate ? 'primary' : 'info'

  return (
    filter.questionTypes.code && (
      <Box>
        <Typography variant="body2" color="info">
          {' '}
          Code languages{' '}
        </Typography>
        <Box>
          <CheckboxLabel
            label={'All'}
            checked={allLanguagesSelected}
            intermediate={isIntermediate}
            color={color}
            onChange={(checked) => {
              if (allLanguagesSelected) {
                return
              }

              const newFilter = { ...filter.codeLanguages }
              Object.keys(newFilter).forEach((key) => {
                newFilter[key] = checked
              })
              updateFilter('codeLanguages', newFilter)
            }}
          />
          {environments.map((language) => (
            <CheckboxLabel
              key={language.language}
              label={language.label}
              checked={filter.codeLanguages[language.language]}
              onChange={(checked) => {
                handleSelectLanguage(language.language)
              }}
            />
          ))}
        </Box>
      </Box>
    )
  )
}

const QuestionTypeSelection = ({ filter, updateFilter }) => {
  const allTypesSelected = Object.values(filter.questionTypes).every(Boolean)
  const someTypesSelected = Object.values(filter.questionTypes).some(Boolean)

  const handleSelectType = useCallback(
    (type) => {
      const newFilter = { ...filter.questionTypes }
      // If all types are selected, unselect all
      if (allTypesSelected) {
        Object.keys(newFilter).forEach((key) => {
          newFilter[key] = false
        })
        updateFilter('questionTypes', newFilter)
      }

      newFilter[type] = !newFilter[type]

      const noTypesSelected = Object.values(newFilter).every((value) => !value)

      // If no types are selected, select all
      if (noTypesSelected) {
        Object.keys(newFilter).forEach((key) => {
          newFilter[key] = true
        })
      }

      updateFilter('questionTypes', newFilter)
    },
    [filter.questionTypes, updateFilter, allTypesSelected],
  )

  const isIntermediate = someTypesSelected && !allTypesSelected
  const color = isIntermediate ? 'primary' : 'info'

  return (
    <Box>
      <Typography variant="body2" color="info">
        Question types
      </Typography>
      <Box>
        <CheckboxLabel
          label={'All'}
          checked={allTypesSelected}
          intermediate={isIntermediate}
          color={color}
          onChange={(checked) => {
            if (allTypesSelected) {
              return
            }

            const newFilter = { ...filter.questionTypes }
            Object.keys(newFilter).forEach((key) => {
              newFilter[key] = checked
            })
            updateFilter('questionTypes', newFilter)
          }}
        />
        {types.map((type) => (
          <CheckboxLabel
            key={type.value}
            label={type.label}
            checked={filter.questionTypes[type.value]}
            onChange={(checked) => {
              handleSelectType(type.value)
            }}
          />
        ))}
      </Box>
    </Box>
  )
}

export default QuestionFilter
