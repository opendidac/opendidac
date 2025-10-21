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
import MultipleChoiceOptionSelect from './MultipleChoiceOptionSelect'
import { TextField, Typography, Stack } from '@mui/material'
import StatusDisplay from '@/components/feedback/StatusDisplay'
import ScrollContainer from '@/components/layout/ScrollContainer'
import { useDebouncedCallback } from 'use-debounce'

const AnswerMultipleChoice = ({
  answer,
  question,
  evaluationId,
  questionId,
  onAnswerChange,
}) => {
  const [options, setOptions] = useState(undefined)
  const [comment, setComment] = useState(answer?.multipleChoice?.comment || '')

  const radio = useMemo(
    () =>
      question.multipleChoice.activateSelectionLimit &&
      question.multipleChoice.selectionLimit === 1,
    [question],
  )

  const limit = useMemo(
    () =>
      question.multipleChoice.activateSelectionLimit &&
      question.multipleChoice.selectionLimit,
    [question],
  )

  useEffect(() => {
    if (question.multipleChoice.options && answer) {
      // merge the options with the users answers

      let allOptions = question.multipleChoice.options
      let studentOptions = answer.multipleChoice?.options

      setOptions(
        allOptions.map((option) => {
          return {
            ...option,
            isCorrect:
              studentOptions &&
              studentOptions.some(
                (studentOption) => studentOption.id === option.id,
              ),
          }
        }),
      )
    }
  }, [answer, question])

  const onOptionChange = useCallback(
    async (id) => {
      const option = options.find((option) => option.id === id)
      if (!option) return

      // Handle radio button behavior
      if (radio) {
        const wasSelected = option.isCorrect
        options.forEach((option) => (option.isCorrect = false))
        option.isCorrect = !wasSelected
      } else if (limit) {
        const selectedOptions = options.filter((option) => option.isCorrect)

        // Prevent selecting more than the limit
        if (selectedOptions.length >= limit && !option.isCorrect) {
          return
        }

        option.isCorrect = !option.isCorrect
      } else {
        option.isCorrect = !option.isCorrect
      }

      const method = option.isCorrect ? 'POST' : 'DELETE'
      const response = await fetch(
        `/api/users/evaluations/${evaluationId}/questions/${questionId}/answers/multi-choice/options`,
        {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ option: option }),
        },
      )
      const ok = response.ok
      const data = await response.json()

      setOptions([...options])

      onAnswerChange && onAnswerChange(ok, data)
    },
    [evaluationId, questionId, onAnswerChange, options, radio, limit],
  )

  const saveComment = useDebouncedCallback(
    useCallback(
      (value) => {
        fetch(
          `/api/users/evaluations/${evaluationId}/questions/${questionId}/answers/multi-choice`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment: value }),
          },
        )
      },
      [evaluationId, questionId],
    ),
    500,
  )

  const onCommentChange = useCallback(
    (value) => {
      setComment(value)
      saveComment(value)
    },
    [saveComment],
  )

  const selectedCount =
    options?.filter((option) => option.isCorrect).length || 0

  return (
    <Stack direction="column" p={2} height={'100%'} spacing={2}>
      <SelectionIndicator limit={limit} options={options} />

      <Stack flex={1}>
        <ScrollContainer>
          <Stack spacing={1}>
            {answer?.multipleChoice &&
              options &&
              options.map((option, index) => (
                <MultipleChoiceOptionSelect
                  key={option.id}
                  round={radio}
                  disabled={
                    !option.isCorrect &&
                    !radio &&
                    limit &&
                    selectedCount >= limit
                  }
                  option={option}
                  onSelect={(id) => onOptionChange(id)}
                />
              ))}
          </Stack>
          {question.multipleChoice.activateStudentComment && (
            <TextField
              sx={{ mt: 2 }}
              multiline
              required
              variant="standard"
              label={question.multipleChoice.studentCommentLabel || 'Comment'}
              size="small"
              value={comment}
              onChange={(ev) => onCommentChange(ev.target.value)}
            />
          )}
        </ScrollContainer>
      </Stack>
    </Stack>
  )
}

const SelectionIndicator = ({ limit, options }) => {
  const remainingOptions = useMemo(
    () =>
      limit &&
      limit - (options?.filter((option) => option.isCorrect).length || 0),
    [options, limit],
  )

  const getMessage = () => {
    if (remainingOptions === limit) {
      return `Select up to ${limit} option${limit > 1 ? 's' : ''}`
    }
    if (remainingOptions > 0) {
      return `Select ${remainingOptions} more option${
        remainingOptions > 1 ? 's' : ''
      }`
    }

    return `Selection limit reached`
  }

  return (
    limit && (
      <Stack direction="row" alignItems="center" spacing={1} pl={0}>
        <StatusDisplay status={remainingOptions > 0 ? 'WARNING' : 'SUCCESS'} />
        <Typography variant="body2">{getMessage()}</Typography>
      </Stack>
    )
  )
}

export default AnswerMultipleChoice
