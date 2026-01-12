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

import { useCallback, useMemo } from 'react'
import { Stack, IconButton, ToggleButton, Button } from '@mui/material'

import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
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
import { useCtrlState } from '@/hooks/useCtrlState'
import { useState, useEffect } from 'react'

const MultipleChoice = ({
  groupScope,
  questionId,
  limiterActivated,
  options: initial,
  previewMode = false,
  onOptionsChanged,
}) => {
  const [options, setOptions] = useState(initial || [])

  useEffect(() => {
    setOptions(initial || [])
  }, [questionId, initial])

  // Optimistic updates to the options state before the debounced API calls

  const saveReorder = useCallback(
    async (reordered) => {
      await fetch(
        `/api/${groupScope}/questions/${questionId}/multiple-choice/order`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            options: reordered,
          }),
        },
      )
      onOptionsChanged && (await onOptionsChanged())
    },
    [groupScope, questionId, onOptionsChanged],
  )

  const debounceSaveReorder = useDebouncedCallback(saveReorder, 300)

  const onReorder = async (sourceIndex, targetIndex) => {
    setOptions((prev) => {
      const next = [...prev]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      const nextAfter = next.map((q, i) => ({ ...q, order: i }))
      return nextAfter
    })
  }

  const onOptionChange = async (id, text, isCorrect) => {
    setOptions((prev) => {
      const next = [...prev]
      const index = next.findIndex((opt) => opt.id === id)
      next[index] = { ...next[index], text, isCorrect }
      return next
    })
  }

  const round = useMemo(
    () =>
      limiterActivated && options.filter((opt) => opt.isCorrect).length === 1,
    [options, limiterActivated],
  )

  return (
    <Stack spacing={2} height="100%">
      <Stack direction="row" justifyContent="flex-end" px={1}>
        <AddOptionButton
          groupScope={groupScope}
          questionId={questionId}
          onAdded={async (created) => {
            setOptions((prev) => [...prev, created])
            onOptionsChanged && (await onOptionsChanged())
          }}
        />
      </Stack>
      <Stack flex={1} minHeight={0}>
        <ScrollContainer spacing={1}>
          <ReorderableList onChangeOrder={onReorder}>
            {options?.map((option, index) => (
              <MultipleChoiceOptionUpdate
                key={index}
                groupScope={groupScope}
                questionId={questionId}
                index={index}
                round={round}
                option={option}
                previewMode={previewMode}
                onHandleDragEnd={async () => {
                  await debounceSaveReorder(options)
                }}
                onOptionsChanged={onOptionsChanged}
                onOptionChange={onOptionChange}
                onDeleteLocal={() => {
                  setOptions((prev) => {
                    const next = [...prev]
                    next.splice(index, 1)
                    return next
                  })
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
  groupScope,
  questionId,
  round = false,
  option,
  previewMode = false,
  onHandleDragEnd,
  onOptionsChanged,
  onOptionChange,
  onDeleteLocal,
  index,
}) => {
  const theme = useTheme()

  const {
    state: text,
    setState: setText,
    get: getText,
  } = useCtrlState(
    option?.text || '',
    `${questionId}-multiple-choice-option-text-${option.id}`,
  )

  const [isCorrect, setIsCorrect] = useState(option?.isCorrect ?? false)

  useEffect(() => {
    setIsCorrect(option?.isCorrect ?? false)
  }, [option?.id, option?.isCorrect])

  const {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    disabled,
    isDragging,
    getDragStyles,
  } = useReorderable()

  const onSaveOption = useCallback(
    async (id, text, isCorrect) => {
      await fetch(
        `/api/${groupScope}/questions/${questionId}/multiple-choice/options/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            text,
            isCorrect,
          }),
        },
      )
      onOptionsChanged && (await onOptionsChanged())
    },
    [groupScope, questionId, onOptionsChanged],
  )

  const debounceSaveOption = useDebouncedCallback(onSaveOption, 300)

  const onChangeOption = useCallback(
    async (id, newText, newIsCorrect) => {
      setText(newText)
      setIsCorrect(newIsCorrect)
      onOptionChange(id, newText, newIsCorrect)
      debounceSaveOption(id, newText, newIsCorrect)
    },
    [onOptionChange, debounceSaveOption, setText, setIsCorrect],
  )

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={getDragStyles(index)}
      p={2}
      borderRadius={2}
      onDragOver={(e) => handleDragOver(e, index)}
      onDragEnd={(e) => {
        handleDragEnd(e, index)
        onHandleDragEnd && onHandleDragEnd()
      }}
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
        selected={isCorrect}
        color="success"
        size="small"
        onChange={(e) => {
          e.stopPropagation()
          onChangeOption(option.id, getText(), !isCorrect)
        }}
        disabled={isDragging}
        sx={
          round && {
            borderRadius: '50%',
          }
        }
      >
        {isCorrect ? <CheckIcon /> : <ClearIcon />}
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
                onChangeOption(option.id, value, isCorrect)
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
          // delete from backend then update local and notify parent
          fetch(
            `/api/${groupScope}/questions/${questionId}/multiple-choice/options/${option.id}`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
            },
          ).then(async (res) => {
            if (res.status === 200) {
              onDeleteLocal()
              onOptionsChanged && (await onOptionsChanged())
            }
          })
        }}
        sx={{ mt: 1 }}
      >
        <DeleteIcon />
      </IconButton>
    </Stack>
  )
}

const AddOptionButton = ({ groupScope, questionId, onAdded }) => {
  const handleAdd = useCallback(async () => {
    const res = await fetch(
      `/api/${groupScope}/questions/${questionId}/multiple-choice/options`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ option: { text: '', isCorrect: false } }),
      },
    )
    if (res.status === 200) {
      const created = await res.json()
      onAdded && onAdded(created)
    }
  }, [groupScope, questionId, onAdded])

  return (
    <Button color="primary" startIcon={<AddIcon />} onClick={() => handleAdd()}>
      Add Option
    </Button>
  )
}

export default MultipleChoice
