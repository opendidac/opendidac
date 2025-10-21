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
import {
  Alert,
  Autocomplete,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createFilterOptions } from '@mui/material/Autocomplete'

const filterOptions = createFilterOptions({
  matchFrom: 'start',
  ignoreCase: true,
  ignoreAccents: true,
  stringify: (option) => option || '',
})

const SEPARATORS = [',', ';', '\n']

const TagsSelector = ({
  options,
  value: initialValue = [],
  label = 'Tags',
  placeholder = '+',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  validateTag = () => true,
  formatTag = (tag) => tag,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState('')
  const [value, setValue] = useState(initialValue)
  const [invalidTags, setInvalidTags] = useState([])

  useEffect(() => {
    if (initialValue && initialValue !== value) {
      setValue(initialValue)
      setInvalidTags(initialValue.filter((tag) => !validateTag(tag)))
    }
  }, [initialValue, validateTag, value])

  // Update the logic to handle both addition and deletion of tags
  const onChangeValue = useCallback(
    (_, newValue) => {
      // Directly update the value with newValue as it includes both added and removed tags
      setValue(newValue)
      // Update invalidTags based on the new set of tags
      setInvalidTags(newValue.filter((tag) => !validateTag(tag)))

      // Invoke the external onChange handler with all tags, if provided
      if (onChange) {
        onChange(newValue)
      }
    },
    [validateTag, onChange],
  )

  const updateTags = useCallback(
    (newTags, index = null, editedTag = null) => {
      let updatedTags = [...value]
      // Check if this is an edit action
      if (index !== null && editedTag !== null) {
        updatedTags[index] = formatTag(editedTag) // Update the specific tag
      } else {
        // Handle adding new tags
        const formattedTags = newTags.map(formatTag)
        updatedTags = Array.from(new Set([...updatedTags, ...formattedTags]))
      }
      setValue(updatedTags)
      setInvalidTags(updatedTags.filter((tag) => !validateTag(tag)))
      if (onChange) {
        onChange(updatedTags)
      }
    },
    [value, formatTag, validateTag, onChange],
  )

  const handleInputChange = useCallback(
    (event, newInputValue, reason) => {
      if (reason === 'input') {
        setInputValue(newInputValue)
      }
      if (reason === 'reset') {
        setInputValue('')
      }
    },
    [setInputValue],
  )

  const handleKeyDown = useCallback(
    (event) => {
      if (SEPARATORS.includes(event.key)) {
        event.preventDefault()
        if (inputValue) {
          const newTags = inputValue
            .split(new RegExp(SEPARATORS.join('|')))
            .filter((tag) => tag)
          updateTags(newTags)
          setInputValue('')
        }
      }
    },
    [inputValue, updateTags],
  )

  const handlePaste = useCallback(
    (event) => {
      const paste = event.clipboardData.getData('text')
      const newTags = paste
        .split(new RegExp(SEPARATORS.join('|')))
        .filter((tag) => tag)
      if (newTags.length) {
        event.preventDefault()
        updateTags(newTags)
      }
    },
    [updateTags],
  )

  const renderTag = useCallback(
    (getTagProps, tag, index, size) => (
      <Tag
        key={tag}
        tag={tag}
        size={size}
        index={index}
        getTagProps={getTagProps}
        validateTag={validateTag}
        onChange={(index, editedTag) => updateTags(value, index, editedTag)}
      />
    ),
    [validateTag, value, updateTags],
  )

  return (
    <>
      <Autocomplete
        multiple
        id="tags-outlined"
        options={options}
        getOptionLabel={(option) => option || ''}
        value={value}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={onChangeValue}
        filterSelectedOptions
        filterOptions={filterOptions}
        fullWidth={fullWidth}
        freeSolo
        size={size}
        onKeyDown={handleKeyDown}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) =>
            renderTag(getTagProps, option, index, size),
          )
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            color={color}
            size={size}
            onPaste={handlePaste}
            placeholder={placeholder}
          />
        )}
      />
      {invalidTags.length > 0 && (
        <Alert severity="error" style={{ marginTop: '8px' }}>
          <Typography
            variant="caption"
            style={{ color: 'red', marginTop: '8px' }}
          >
            {invalidTags.length} invalid value
            {invalidTags.length > 1 ? 's' : ''}!
          </Typography>
        </Alert>
      )}
    </>
  )
}

const Tag = ({
  tag: initial,
  index,
  validateTag,
  getTagProps,
  size,
  onChange,
}) => {
  const [tag, setTag] = useState(initial)
  const [mode, setMode] = useState('view')
  const inputRef = useRef(null) // Ref for the TextField

  useEffect(() => {
    setTag(initial)
  }, [initial])

  useEffect(() => {
    // When mode changes to 'edit', focus the input
    if (mode === 'edit' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [mode])

  const handleDoubleClick = useCallback((event) => {
    event.stopPropagation() // Prevent the event from bubbling up
    setMode('edit')
  }, [])

  const handleKeyPress = useCallback(
    (event) => {
      // Stop event propagation on key press to prevent it from affecting Autocomplete
      event.stopPropagation()

      // Optional: Implement custom behavior for specific keys if needed
      if (event.key === 'Enter') {
        setMode('view')
        onChange(index, tag)
      }
    },
    [tag, onChange, index],
  )

  return (
    <Stack direction="row" spacing={1}>
      {mode === 'view' ? (
        <Chip
          variant="outlined"
          color={validateTag(tag) ? 'default' : 'error'}
          label={tag}
          size={size}
          {...getTagProps({ index })}
          onDoubleClick={handleDoubleClick}
        />
      ) : (
        <TextField
          size="small"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          onBlur={() => {
            setMode('view')
            onChange(index, tag)
          }}
          onKeyDown={handleKeyPress}
          inputRef={inputRef}
        />
      )}
    </Stack>
  )
}

export default TagsSelector
