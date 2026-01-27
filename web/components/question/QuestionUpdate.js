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
import { useCallback, useState, useEffect } from 'react'
import Image from 'next/image'
import { Stack, TextField, Button, Typography, Tooltip } from '@mui/material'
import MarkdownEditor from '../input/markdown/MarkdownEditor'
import { useCtrlState } from '@/hooks/useCtrlState'

import LayoutSplitScreen from '../layout/LayoutSplitScreen'
import QuestionTypeSpecific from './QuestionTypeSpecific'
import { useDebouncedCallback } from 'use-debounce'
import { useSnackbar } from '../../context/SnackbarContext'

import QuestionTagsSelector from './tags/QuestionTagsSelector'
import { useRouter } from 'next/router'
import Loading from '../feedback/Loading'
import { fetcher } from '../../core/utils'
import DialogFeedback from '../feedback/DialogFeedback'
import { QuestionStatus } from '@prisma/client'
import BottomCollapsiblePanel from '@/components/layout/utils/BottomCollapsiblePanel'
import ScratchPad from '@/components/question/ScratchPad'

const QuestionUpdate = ({ groupScope, questionId, onUpdate, onDelete }) => {
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

  const [archiveQuestionDialogOpen, setArchiveQuestionDialogOpen] =
    useState(false)
  const [unarchiveQuestionDialogOpen, setUnarchiveQuestionDialogOpen] =
    useState(false)
  const [deleteQuestionDialogOpen, setDeleteQuestionDialogOpen] =
    useState(false)

  const { state: title, setStateControlled: setTitle } = useCtrlState(
    question?.title || '',
    question &&
      questionId &&
      `question-${questionId}-title-${question ? 'loaded' : 'loading'}`,
  )

  const { state: content, setState: setContent } = useCtrlState(
    question?.content || '',
    question &&
      questionId &&
      `question-${questionId}-content-${question ? 'loaded' : 'loading'}`,
  )

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

  const archiveQuestion = useCallback(async () => {
    await fetch(`/api/${groupScope}/questions/${question.id}/archive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then(async () => {
        await mutate()
        onDelete && onDelete(question)
        showSnackbar('Question archived', 'success')
        await router.push(`/${groupScope}/questions`)
      })
      .catch(() => {
        showSnackbar('Error archiving question', 'error')
      })
  }, [question, showSnackbar, router, mutate, onDelete, groupScope])

  const unarchiveQuestion = useCallback(async () => {
    await fetch(`/api/${groupScope}/questions/${question.id}/unarchive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then(async () => {
        await mutate()
        onUpdate && onUpdate(question)
        showSnackbar('Question unarchived', 'success')
      })
      .catch(() => {
        showSnackbar('Error unarchiving question', 'error')
      })
  }, [question, showSnackbar, mutate, onUpdate, groupScope])

  const deleteQuestion = useCallback(async () => {
    await fetch(`/api/${groupScope}/questions/${question.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then(async () => {
        onDelete && onDelete(question)
        showSnackbar('Question permanently deleted', 'success')
        await router.push(`/${groupScope}/questions`)
      })
      .catch(() => {
        showSnackbar('Error deleting question', 'error')
      })
  }, [question, showSnackbar, router, onDelete, groupScope])

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

  // Flush pending debounced saves on unmount
  useEffect(() => {
    return () => {
      debounceChange.flush()
    }
  }, [debounceChange])

  const onPropertyChange = useCallback(
    async (question, property, value) => {
      // instantly update the question object in memory
      question[property] = value
      // debounce the change to the api
      await debounceChange()
    },
    [debounceChange],
  )

  return (
    <Loading loading={!question} errors={[error]}>
      <LayoutSplitScreen
        leftPanel={
          question && (
            <BottomCollapsiblePanel
              bottomPanel={
                <ScratchPad
                  content={question.scratchpad}
                  onChange={(content) =>
                    onPropertyChange(question, 'scratchpad', content)
                  }
                />
              }
            >
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
                      const value = e.target.value
                      setTitle(value)
                      onPropertyChange(question, 'title', value)
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
                  rawContent={content}
                  onChange={(newContent) => {
                    setContent(newContent)
                    onPropertyChange(question, 'content', newContent)
                  }}
                />

                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  width={'100%'}
                  pb={1}
                  alignItems={'center'}
                  spacing={2}
                >
                  {question.status === QuestionStatus.ACTIVE ? (
                    <Tooltip title="Add to archive">
                      <Button
                        startIcon={
                          <Image
                            alt="Archive"
                            src="/svg/icons/archive.svg"
                            width="18"
                            height="18"
                          />
                        }
                        onClick={() => setArchiveQuestionDialogOpen(true)}
                      >
                        Archive this question
                      </Button>
                    </Tooltip>
                  ) : (
                    <>
                      <Tooltip title="Restore from archive">
                        <Button
                          color="info"
                          startIcon={
                            <Image
                              alt="Unarchive"
                              src="/svg/icons/archive-blue.svg"
                              width="18"
                              height="18"
                            />
                          }
                          onClick={() => setUnarchiveQuestionDialogOpen(true)}
                        >
                          Unarchive
                        </Button>
                      </Tooltip>
                      <Tooltip title="Delete permanently">
                        <Button
                          color="error"
                          startIcon={
                            <Image
                              alt="Delete"
                              src="/svg/icons/delete.svg"
                              width="18"
                              height="18"
                            />
                          }
                          onClick={() => setDeleteQuestionDialogOpen(true)}
                        >
                          Delete permanently
                        </Button>
                      </Tooltip>
                    </>
                  )}
                </Stack>
              </Stack>
            </BottomCollapsiblePanel>
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
                  onPropertyChange(question, type, value)
                }}
              />
            </Stack>
          )
        }
      />
      <DialogFeedback
        open={archiveQuestionDialogOpen}
        title="Archive question"
        content={
          <Typography variant="body1">
            You are about to archive this question. Are you sure?
          </Typography>
        }
        onClose={() => setArchiveQuestionDialogOpen(false)}
        onConfirm={archiveQuestion}
      />
      <DialogFeedback
        open={unarchiveQuestionDialogOpen}
        title="Unarchive question"
        content={
          <Typography variant="body1">
            You are about to restore this question from archive. Are you sure?
          </Typography>
        }
        onClose={() => setUnarchiveQuestionDialogOpen(false)}
        onConfirm={unarchiveQuestion}
      />
      <DialogFeedback
        open={deleteQuestionDialogOpen}
        title="Delete question permanently"
        content={
          <Typography variant="body1">
            You are about to permanently delete this question. This action
            cannot be undone. Are you sure?
          </Typography>
        }
        onClose={() => setDeleteQuestionDialogOpen(false)}
        onConfirm={deleteQuestion}
      />
    </Loading>
  )
}

export default QuestionUpdate
