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
import React, { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { QuestionType, StudentAnswerStatus } from '@prisma/client'
import { useDebouncedCallback } from 'use-debounce'
import { useRouter } from 'next/router'
import { Button, Stack, Typography } from '@mui/material'
import { fetcher } from '@/code/utils'

import TrueFalse from '@/components/question/type_specific/TrueFalse'
import Loading from '@/components/feedback/Loading'
import WebEditor from '@/components/question/type_specific/web/WebEditor'
import ResizePanel from '@/components/layout/utils/ResizePanel'
import PreviewPanel from '@/components/question/type_specific/web/PreviewPanel'
import ScrollContainer from '@/components//layout/ScrollContainer'
import AnswerDatabase from './database/AnswerDatabase'
import AnswerCode from './code/AnswerCode'
import AlertFeedback from '../feedback/AlertFeedback'
import { LoadingButton } from '@mui/lab'
import { useSnackbar } from '@/context/SnackbarContext'
import Overlay from '../ui/Overlay'

import AnswerMultipleChoice from './multipleChoice/AnswerMultipleChoice'
import MarkdownEditor from '../input/markdown/MarkdownEditor'

const SubmittedOverlay = ({ onUnsubmit }) => {
  return (
    <Overlay>
      <Stack spacing={2} alignItems={'center'}>
        <AlertFeedback severity={'success'}>
          <Typography variant={'body1'}>
            Your answer to this question has been submitted
          </Typography>
          <Typography variant={'body2'}>
            You can unsubmit your answer if you want to make changes
          </Typography>
        </AlertFeedback>

        <Button onClick={onUnsubmit} variant={'text'}>
          Unsubmit
        </Button>
      </Stack>
    </Overlay>
  )
}

const AnswerEditor = ({
  status: initial,
  questionId,
  onAnswer,
  onSubmit,
  onUnsubmit,
}) => {
  const router = useRouter()

  const { showBottomRight: showSnackbar } = useSnackbar()

  const { evaluationId } = router.query

  const {
    data: questionAnswer,
    error,
    mutate,
  } = useSWR(
    `/api/users/evaluations/${evaluationId}/questions/${questionId}/answers`,
    evaluationId && questionId ? fetcher : null,
    { revalidateOnFocus: false },
  )

  const studentAnswer = questionAnswer?.studentAnswer
  const question = questionAnswer?.question

  const [status, setStatus] = useState(initial)

  useEffect(() => setStatus(initial), [initial])

  useEffect(() => {
    setStatus(studentAnswer?.status)
  }, [studentAnswer])

  const [submitLock, setSubmitLock] = useState(false)

  const onAnswerChange = useCallback(
    (ok, data) => {
      if (!ok) {
        showSnackbar(data.message, 'error')
        return
      }
      setStatus(data.status)
      if (onAnswer) {
        onAnswer(question, data)
      }
    },
    [onAnswer, question, showSnackbar],
  )

  const onSubmitClick = useCallback(async () => {
    setSubmitLock(true)
    const response = await fetch(
      `/api/users/evaluations/${evaluationId}/questions/${question.id}/answers/submit`,
      {
        method: 'PUT',
      },
    )

    const ok = response.ok
    const data = await response.json()

    if (!ok) {
      showSnackbar(data.message, 'error')
    } else {
      setStatus(StudentAnswerStatus.SUBMITTED)
      onSubmit && onSubmit(question)
      await mutate()
    }

    setSubmitLock(false)
  }, [onSubmit, question, evaluationId, mutate, showSnackbar])

  const onUnsubmitClick = useCallback(async () => {
    setSubmitLock(true)
    const response = await fetch(
      `/api/users/evaluations/${evaluationId}/questions/${question.id}/answers/submit`,
      {
        method: 'DELETE',
      },
    )

    const ok = response.ok
    const data = await response.json()

    if (!ok) {
      showSnackbar(data.message, 'error')
    } else {
      setStatus(StudentAnswerStatus.IN_PROGRESS)
      onUnsubmit && onUnsubmit(question)
      await mutate()
    }
    setSubmitLock(false)
  }, [onUnsubmit, question, evaluationId, mutate, showSnackbar])

  const isReadOnly = status === StudentAnswerStatus.SUBMITTED

  return (
    <Loading errors={[error]} loading={!studentAnswer}>
      <Stack height={'100%'} position={'relative'}>
        {isReadOnly && (
          <SubmittedOverlay onUnsubmit={() => onUnsubmitClick()} />
        )}
        {question &&
          ((question.type === QuestionType.trueFalse && (
            <AnswerTrueFalse
              answer={studentAnswer}
              evaluationId={evaluationId}
              questionId={question.id}
              onAnswerChange={onAnswerChange}
            />
          )) ||
            (question.type === QuestionType.multipleChoice && (
              <AnswerMultipleChoice
                answer={studentAnswer}
                question={question}
                evaluationId={evaluationId}
                questionId={question.id}
                onAnswerChange={onAnswerChange}
              />
            )) ||
            (question.type === QuestionType.essay && (
              <AnswerEssay
                answer={studentAnswer}
                evaluationId={evaluationId}
                questionId={question.id}
                onAnswerChange={onAnswerChange}
              />
            )) ||
            (question.type === QuestionType.code && (
              <AnswerCode
                evaluationId={evaluationId}
                questionId={question.id}
                onAnswerChange={onAnswerChange}
              />
            )) ||
            (question.type === QuestionType.web && (
              <AnswerWeb
                answer={studentAnswer}
                evaluationId={evaluationId}
                questionId={question.id}
                onAnswerChange={onAnswerChange}
              />
            )) ||
            (question.type === QuestionType.database && (
              <AnswerDatabase
                answer={studentAnswer}
                question={question}
                evaluationId={evaluationId}
                onAnswerChange={onAnswerChange}
              />
            )))}
        <SubmissionToolbar
          lock={submitLock}
          status={status}
          onSubmit={onSubmitClick}
          onUnsubmit={onUnsubmitClick}
        />
      </Stack>
    </Loading>
  )
}

const SubmissionToolbar = ({ lock, status, onSubmit, onUnsubmit }) => {
  return (
    status !== StudentAnswerStatus.MISSING && (
      <Stack
        position={'absolute'}
        bottom={0}
        right={0}
        mb={2}
        mr={1}
        zIndex={200}
      >
        {status === StudentAnswerStatus.SUBMITTED ? (
          <LoadingButton
            loading={lock}
            onClick={onUnsubmit}
            variant={'contained'}
            size="small"
          >
            Unsubmit
          </LoadingButton>
        ) : (
          <LoadingButton
            loading={lock}
            onClick={onSubmit}
            variant={'contained'}
            color={'info'}
            size="small"
          >
            Submit
          </LoadingButton>
        )}
      </Stack>
    )
  )
}

const AnswerTrueFalse = ({
  answer,
  evaluationId,
  questionId,
  onAnswerChange,
}) => {
  const onTrueFalseChange = useCallback(
    async (isTrue) => {
      const answer = {
        answer:
          isTrue !== undefined
            ? {
                isTrue: isTrue,
              }
            : undefined,
      }

      const response = await fetch(
        `/api/users/evaluations/${evaluationId}/questions/${questionId}/answers`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answer),
        },
      )

      const ok = response.ok
      const data = await response.json()

      onAnswerChange && onAnswerChange(ok, data)
    },
    [evaluationId, questionId, onAnswerChange],
  )

  return (
    answer?.trueFalse && (
      <TrueFalse
        id={`answer-editor-${questionId}`}
        allowUndefined={true}
        isTrue={answer.trueFalse.isTrue}
        onChange={onTrueFalseChange}
      />
    )
  )
}

const AnswerEssay = ({ answer, evaluationId, questionId, onAnswerChange }) => {
  const onEssayChange = useCallback(
    async (content) => {
      if (answer.essay.content === content) return
      const response = await fetch(
        `/api/users/evaluations/${evaluationId}/questions/${questionId}/answers`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            answer: content
              ? {
                  content: content,
                }
              : undefined,
          }),
        },
      )

      const ok = response.ok
      const data = await response.json()

      onAnswerChange && onAnswerChange(ok, data)
    },
    [evaluationId, questionId, answer, onAnswerChange],
  )

  const debouncedOnChange = useDebouncedCallback(onEssayChange, 500)

  return (
    answer?.essay && (
      <MarkdownEditor
        id={`answer-editor-${questionId}`}
        rawContent={answer.essay.content}
        onChange={(newContent) => {
          debouncedOnChange(newContent)
        }}
      />
    )
  )
}

const AnswerWeb = ({ answer, evaluationId, questionId, onAnswerChange }) => {
  const [web, setWeb] = useState(answer?.web)

  useEffect(() => {
    if (answer?.web) {
      setWeb(answer.web)
    }
  }, [answer])

  const onWebChange = useCallback(
    async (web) => {
      const isEmptyWeb = !web || (!web.html && !web.css && !web.js)
      const answer = {
        answer: !isEmptyWeb
          ? {
              ...web,
            }
          : undefined,
      }

      const response = await fetch(
        `/api/users/evaluations/${evaluationId}/questions/${questionId}/answers`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answer),
        },
      )

      const ok = response.ok
      const data = await response.json()

      onAnswerChange && onAnswerChange(ok, data)
    },
    [evaluationId, questionId, onAnswerChange],
  )

  const debouncedOnChange = useDebouncedCallback(onWebChange, 500)

  return (
    answer?.web && (
      <ResizePanel
        leftPanel={
          <ScrollContainer>
            <Stack spacing={0} pt={0} position={'relative'} pb={24}>
              <WebEditor
                id={'web-answer-editor'}
                web={web}
                onChange={(web) => {
                  setWeb(web)
                  debouncedOnChange(web)
                }}
              />
            </Stack>
          </ScrollContainer>
        }
        rightPanel={<PreviewPanel id={`web-preview-${questionId}`} web={web} />}
      />
    )
  )
}

export default AnswerEditor
