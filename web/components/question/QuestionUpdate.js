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
import useSWR from 'swr'
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Stack, TextField, Typography } from '@mui/material'
import MarkdownEditor from '../input/markdown/MarkdownEditor'

import LayoutSplitScreen from '../layout/LayoutSplitScreen'
import QuestionTypeSpecific from './QuestionTypeSpecific'
import { useDebouncedCallback } from 'use-debounce'

import { useSnackbar } from '../../context/SnackbarContext'

import QuestionTagsSelector from './tags/QuestionTagsSelector'
import { useRouter } from 'next/router'
import Loading from '../feedback/Loading'
import { fetcher } from '../../code/utils'

const QuestionUpdate = ({ groupScope, questionId, onUpdate }) => {
  const router = useRouter()
  const { show: showSnackbar } = useSnackbar()

  const {
    data: question,
    mutate,
    error,
  } = useSWR(
    `/api/${groupScope}/questions/${questionId}`,
    questionId ? fetcher : null,
    {
      revalidateOnFocus: false,
    },
  )

  const [title, setTitle] = useState(question?.title || '')

  useEffect(() => {
    if (question) {
      setTitle(question.title)
    }
  }, [question])

  const saveQuestion = useCallback(
    async (question) => {
      await fetch(`/api/${groupScope}/questions/${question.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ question }),
      })
        .then((res) => res.json())
        .then(async (question) => {
          onUpdate && onUpdate(question)
          showSnackbar('Question saved', 'success')
        })
        .catch(() => {
          showSnackbar('Error saving questions', 'error')
        })
    },
    [groupScope, showSnackbar, onUpdate],
  )

  const onChangeQuestion = useCallback(
    async (question) => {
      await saveQuestion(question)
    },
    [saveQuestion],
  )

  const debounceChange = useDebouncedCallback(
    useCallback(async () => {
      await onChangeQuestion(question)
    }, [question, onChangeQuestion]),
    500,
  )

  const onPropertyChange = useCallback(
    async (property, value) => {
      // instantly update the question object in memory
      question[property] = value
      // debounce the change to the api
      await debounceChange()
    },
    [question, debounceChange],
  )

  return (
    <Loading loading={!question} errors={[error]}>
      <LayoutSplitScreen
        leftPanel={
          question && (
            <Stack spacing={2} sx={{ pl: 2, pt: 1, height: '100%' }}>
              <Stack direction="row" alignItems="flex-start" spacing={1}>
                <TextField
                  id={`question-${question.id}-title`}
                  label="Title"
                  variant="outlined"
                  fullWidth
                  focused
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    onPropertyChange('title', e.target.value)
                  }}
                />
              </Stack>

              <QuestionTagsSelector
                groupScope={groupScope}
                questionId={question.id}
                onChange={() => onUpdate && onUpdate(question)}
              />
              <MarkdownEditor
                id={`question-${question.id}`}
                groupScope={groupScope}
                withUpload
                title="Problem Statement"
                rawContent={question.content}
                onChange={(content) => onPropertyChange('content', content)}
              />
            </Stack>
          )
        }
        rightPanel={
          question && (
            <Stack flex={1}>
              <QuestionTypeSpecific
                groupScope={groupScope}
                question={question}
                onUpdate={() => {
                  onUpdate && onUpdate(question)
                  mutate()
                }}
                onTypeSpecificChange={(type, value) => {
                  onPropertyChange(type, value)
                }}
              />
            </Stack>
          )
        }
      />
    </Loading>
  )
}

export default QuestionUpdate
