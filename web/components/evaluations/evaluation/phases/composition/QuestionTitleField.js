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
import { useState, useCallback, useEffect } from 'react'
import { TextField, Typography } from '@mui/material'
import { useDebouncedCallback } from 'use-debounce'

const QuestionTitleField = ({
  evaluationToQuestion,
  readOnly = false,
  onSave,
  id,
}) => {
  const [localTitle, setLocalTitle] = useState(
    evaluationToQuestion.title || evaluationToQuestion.question.title,
  )
  const [isSaving, setIsSaving] = useState(false)

  // Update local state when the question ID changes (not just reordering)
  useEffect(() => {
    setLocalTitle(
      evaluationToQuestion.title || evaluationToQuestion.question.title,
    )
    // the "id" is used to control the state (reload the title) only when the id changes
    // this is important to manage the state correctly during reordering
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const saveTitle = useCallback(
    async (newTitle) => {
      if (isSaving) return // Prevent multiple simultaneous saves

      setIsSaving(true)
      try {
        await onSave({
          ...evaluationToQuestion,
          title: newTitle,
        })
      } catch (error) {
        console.error('Failed to save title:', error)
        // Optionally show error feedback to user
      } finally {
        setIsSaving(false)
      }
    },
    [evaluationToQuestion, onSave, isSaving],
  )

  const debouncedSave = useDebouncedCallback(saveTitle, 500)

  const handleTitleChange = useCallback(
    (event) => {
      const newTitle = event.target.value
      setLocalTitle(newTitle)
      debouncedSave(newTitle)
    },
    [debouncedSave],
  )

  if (readOnly) {
    return (
      <Typography variant="body2">
        {evaluationToQuestion.title || evaluationToQuestion.question.title}
      </Typography>
    )
  }

  return (
    <TextField
      variant="standard"
      size="small"
      value={localTitle}
      placeholder={evaluationToQuestion.question.title}
      onChange={handleTitleChange}
      disabled={isSaving}
      sx={{
        flexGrow: 1,
        '& .MuiInput-underline:before': {
          borderBottomColor: 'transparent',
        },
        '& .MuiInput-underline:hover:before': {
          borderBottomColor: 'rgba(0, 0, 0, 0.42)',
        },
        '& .MuiInput-underline:after': {
          borderBottomColor: 'rgba(0, 0, 0, 0.42)',
        },
        '& .MuiInputBase-input': {
          padding: '4px 0',
        },
      }}
    />
  )
}

export default QuestionTitleField
