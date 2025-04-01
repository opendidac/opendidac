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
import { Stack, IconButton, ToggleButton } from '@mui/material'

import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import ClearIcon from '@mui/icons-material/Clear'

import DragHandleSVG from '@/components/layout/utils/DragHandleSVG'
import ReorderableList from '@/components/layout/utils/ReorderableList'
import { useDebouncedCallback } from 'use-debounce'
import ScrollContainer from '@/components/layout/ScrollContainer'
import { useReorderable } from '@/components/layout/utils/ReorderableList'
import MarkdownEditor from '@/components/input/markdown/MarkdownEditor'
import MarkdownViewer from '@/components/input/markdown/MarkdownViewer'
import { useTheme } from '@emotion/react'

const MultipleChoice = ({
  id = 'multi_choice',
  limiterActivated,
  options: initial,
  previewMode = false,
  onChangeOption,
  onChangeOrder,
  onDelete,
}) => {
  const [options, setOptions] = useState([])

  useEffect(() => {
    if (initial) {
      if (initial && initial.length > 0) {
        setOptions(initial)
      }
    }
  }, [initial, id])

  const selectOption = (id) => {
    const option = options.find((option) => option.id === id)
    option.isCorrect = !option.isCorrect
    setOptions([...options])
    onChangeOption(option)
  }

  const onReorder = useCallback(
    async (sourceIndex, targetIndex) => {
      const reordered = [...options]

      // Remove the element from its original position
      const [removedElement] = reordered.splice(sourceIndex, 1)

      // Insert the element at the target position
      reordered.splice(targetIndex, 0, removedElement)

      // Update the order properties for all elements
      reordered.forEach((item, index) => {
        item.order = index
      })

      setOptions(reordered)
      onChangeOrder(reordered)
    },
    [options, onChangeOrder],
  )

  const round = useMemo(
    () =>
      limiterActivated && options.filter((opt) => opt.isCorrect).length === 1,
    [options, limiterActivated],
  )

  return (
    <Stack spacing={2} height="100%">
      <Stack flex={1} minHeight={0}>
        <ScrollContainer spacing={1}>
          <ReorderableList onChangeOrder={onReorder}>
            {options?.map((option, index) => (
              <MultipleChoiceOptionUpdate
                key={index}
                index={index}
                round={round}
                option={option}
                previewMode={previewMode}
                onSelect={(id) => selectOption(id)}
                onChangeOption={(value) => {
                  const newOptions = [...options]
                  const option = newOptions[index]
                  option.text = value
                  setOptions(newOptions)
                  onChangeOption(option)
                }}
                onDelete={(option) => {
                  let newOptions = [...options]
                  const deleted = newOptions.find((opt) => opt.id === option.id)
                  newOptions.splice(index, 1)
                  setOptions(newOptions)
                  onDelete(deleted)
                }}
              />
            ))}
          </ReorderableList>
        </ScrollContainer>
      </Stack>
    </Stack>
  )
}

const MultipleChoiceOptionUpdate = ({
  round = false,
  option,
  previewMode = false,
  onSelect,
  onChangeOption,
  onDelete,
  index,
}) => {
  const [text, setText] = useState(option.text)
  const {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    disabled,
    isDragging,
    getDragStyles,
  } = useReorderable()

  useEffect(() => {
    setText(option.text)
  }, [option?.text])

  const debounceOnChange = useDebouncedCallback(onChangeOption, 1000)
  const theme = useTheme()

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={getDragStyles(index)}
      p={1}
      borderRadius={2}
      onDragOver={(e) => handleDragOver(e, index)}
      onDragEnd={(e) => handleDragEnd(e, index)}
      bgcolor={theme.palette.background.default}
    >
      <Stack
        sx={{
          cursor: disabled ? 'not-allowed' : 'grab',
          '&:active': {
            cursor: 'grabbing',
          },
        }}
        draggable={!disabled}
        onDragStart={(e) => handleDragStart(e, index)}
      >
        <DragHandleSVG />
      </Stack>

      <ToggleButton
        value="correct"
        selected={option.isCorrect}
        color="success"
        size="small"
        onChange={(e) => onSelect(option.id)}
        disabled={isDragging}
        sx={
          round && {
            borderRadius: '50%',
          }
        }
      >
        {option.isCorrect ? <CheckIcon /> : <ClearIcon />}
      </ToggleButton>

      <Stack width={'100%'} height={'100%'}>
        {previewMode ? (
          <MarkdownViewer content={text} />
        ) : (
          <Stack minHeight={250} bgcolor={theme.palette.background.paper} p={1}>
            <MarkdownEditor
              title={`Option ${option.order + 1} (markdown)`}
              rawContent={text}
              onChange={(value) => {
                setText(value)
                debounceOnChange(value)
              }}
              withUpload={false}
            />
          </Stack>
        )}
      </Stack>

      <IconButton
        variant="small"
        color="error"
        disabled={isDragging}
        onClick={() => {
          onDelete(option)
        }}
        sx={{ mt: 1 }}
      >
        <DeleteIcon />
      </IconButton>
    </Stack>
  )
}

export default MultipleChoice
