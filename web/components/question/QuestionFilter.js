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

import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material'
import PushPinIcon from '@mui/icons-material/PushPin'

import { toArray as typesToArray } from './types.js'
import languages from '../../code/languages.json'
import { useTags } from '../../context/TagContext'
import TagsSelector from '../input/TagsSelector'
import CheckboxLabel from '../input/CheckboxLabel.js'
import { QuestionStatus } from '@prisma/client'
import { usePinnedFilter } from '@/context/PinnedFilterContext'

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

const applyFilter = async (toApply) => {
  const query = { ...toApply }
  query.questionTypes = Object.keys(query.questionTypes).filter(
    (key) => query.questionTypes[key],
  )
  if (!toApply.questionTypes.code) {
    delete query.codeLanguages
  }
  if (query.codeLanguages) {
    query.codeLanguages = Object.keys(query.codeLanguages).filter(
      (key) => query.codeLanguages[key],
    )
  }
  query.questionStatus = toApply.questionStatus
  if (!toApply.unused) {
    delete query.unused
  }
  return query
}

const queryStringToFilter = (queryString) => {
  const params = new URLSearchParams(queryString)

  // Build the filter object based on the query string
  const filter = {
    search: params.get('search') || initialFilters.search,
    tags: params.get('tags')
      ? params.get('tags').split(',')
      : initialFilters.tags,
    questionStatus:
      params.get('questionStatus') || initialFilters.questionStatus,
    questionTypes: { ...initialFilters.questionTypes },
    codeLanguages: { ...initialFilters.codeLanguages },
    unused: params.get('unused') === 'true' || initialFilters.unused,
  }

  if (params.get('questionTypes')) {
    // set all questionTypes to false
    Object.keys(filter.questionTypes).forEach((type) => {
      filter.questionTypes[type] = false
    })

    // Update questionTypes and codeLanguages based on the query string
    params
      .get('questionTypes')
      .split(',')
      .forEach((type) => {
        if (filter.questionTypes.hasOwnProperty(type)) {
          filter.questionTypes[type] = true
        }
      })
  }

  // Update codeLanguages based on the query string
  if (params.get('codeLanguages')) {
    // set all codeLanguages to false
    Object.keys(filter.codeLanguages).forEach((language) => {
      filter.codeLanguages[language] = false
    })

    // Update codeLanguages based on the query string
    params
      .get('codeLanguages')
      ?.split(',')
      .forEach((language) => {
        if (filter.codeLanguages.hasOwnProperty(language)) {
          filter.codeLanguages[language] = true
        }
      })
  }

  return filter
}

const QuestionFilter = ({ filters: initial, onApplyFilter }) => {
  const tagsContext = useTags() // Get the whole context first

  const { setPinnedFilter } = usePinnedFilter()

  const { tags: allTags = [] } = tagsContext // Destructure safely

  const [questionStatus, setQuestionStatus] = useState(QuestionStatus.ACTIVE)

  const [filter, setFilter] = useState(queryStringToFilter(initial))

  useEffect(() => {
    setFilter(queryStringToFilter(initial))
  }, [initial])

  const updateFilter = useCallback(
    (key, value) => {
      const newFilter = { ...filter, [key]: value }
      setFilter(newFilter)
    },
    [filter],
  )

  const isFilterApplied = useCallback(() => {
    // Compare each filter field with its initial value
    return (
      filter.search !== initialFilters.search ||
      JSON.stringify(filter.tags) !== JSON.stringify(initialFilters.tags) ||
      filter.questionStatus !== initialFilters.questionStatus ||
      JSON.stringify(filter.questionTypes) !==
        JSON.stringify(initialFilters.questionTypes) ||
      JSON.stringify(filter.codeLanguages) !==
        JSON.stringify(initialFilters.codeLanguages) ||
      filter.unused !== initialFilters.unused
    )
  }, [filter])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault() // Prevent default form submission which reloads the page
      const newFilter = await applyFilter({ ...filter, questionStatus })
      onApplyFilter && onApplyFilter(new URLSearchParams(newFilter).toString())
    },
    [filter, questionStatus, onApplyFilter],
  )

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} padding={2}>
        <TextField
          label={'Search'}
          variant="outlined"
          fullWidth
          color="info"
          size="small"
          value={filter.search}
          onChange={(e) => updateFilter('search', e.target.value)}
        />

        <TagsSelector
          label={'Tags'}
          size={'small'}
          color={'info'}
          options={allTags.map((tag) => tag.label)}
          value={filter.tags}
          onChange={(tags) => updateFilter('tags', tags)}
        />

        <Stack direction="row" justifyContent="flex-start">
          <RadioGroup
            row
            value={questionStatus}
            onChange={(e) => setQuestionStatus(e.target.value)}
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
          checked={filter.unused}
          onChange={(checked) => updateFilter('unused', checked)}
          color="info"
        />

        <QuestionTypeSelection filter={filter} updateFilter={updateFilter} />
        <LanguageSelection filter={filter} updateFilter={updateFilter} />
        <Stack direction={'row'} spacing={2}>
          <Button
            variant="contained"
            color="info"
            fullWidth
            startIcon={<PushPinIcon />}
            onClick={() => {
              setPinnedFilter(filter)
            }}
          >
            {' '}
            Pin{' '}
          </Button>
          <Button
            variant="outlined"
            disabled={!isFilterApplied()}
            onClick={async () => {
              setFilter(initialFilters)
              setQuestionStatus(initialFilters.questionStatus)
              onApplyFilter &&
                onApplyFilter(
                  new URLSearchParams(
                    await applyFilter(initialFilters),
                  ).toString(),
                )
            }}
          >
            {' '}
            Clear{' '}
          </Button>
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

  const is_intermediate = someLanguagesSelected && !allLanguagesSelected
  const color = is_intermediate ? 'primary' : 'info'

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
            intermediate={is_intermediate}
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

  const is_intermediate = someTypesSelected && !allTypesSelected
  const color = is_intermediate ? 'primary' : 'info'

  return (
    <Box>
      <Typography variant="body2" color="info">
        Question types
      </Typography>
      <Box>
        <CheckboxLabel
          label={'All'}
          checked={allTypesSelected}
          intermediate={is_intermediate}
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
