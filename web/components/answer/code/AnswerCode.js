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

import { useEffect, useEffectEvent, useState } from 'react'
import useSWR from 'swr'
import { CodeQuestionType } from '@prisma/client'

import { fetcher } from '@/core/utils'
import Loading from '@/components/feedback/Loading'

import AnswerCodeReading from './codeReading/AnswerCodeReading'
import AnswerCodeWriting from './codeWriting/AnswerCodeWriting'

const AnswerCode = ({ evaluationId, questionId, onAnswerChanged }) => {
  const { data: questionAnswer, error } = useSWR(
    `/api/users/evaluations/${evaluationId}/questions/${questionId}/answers`,
    questionId ? fetcher : null,
    { revalidateOnFocus: false },
  )

  // Snapshot what we hand to the editors. The SWR cache can revalidate
  // and mutate freely; the editors only see a new answer when the
  // (evaluationId, questionId) pair changes, so the cursor / derived
  // state never resets mid-session.
  const [snapshot, setSnapshot] = useState(null)
  const captureLatest = useEffectEvent(() => {
    if (questionAnswer) setSnapshot(questionAnswer)
  })
  useEffect(() => {
    captureLatest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationId, questionId, !!questionAnswer])

  const { question, studentAnswer } = snapshot || {}

  return (
    <Loading errors={!snapshot ? [error] : []} loading={!snapshot}>
      {studentAnswer?.code?.codeType === CodeQuestionType.codeWriting && (
        <AnswerCodeWriting
          evaluationId={evaluationId}
          questionId={questionId}
          question={question}
          answer={studentAnswer}
          onAnswerChanged={onAnswerChanged}
        />
      )}
      {studentAnswer?.code?.codeType === CodeQuestionType.codeReading && (
        <AnswerCodeReading
          evaluationId={evaluationId}
          questionId={questionId}
          question={question}
          answer={studentAnswer}
          onAnswerChanged={onAnswerChanged}
        />
      )}
    </Loading>
  )
}

export default AnswerCode
