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
import React, { useCallback, useEffect, useState } from 'react'
import { Stack } from '@mui/system'
import MarkdownViewer from '@/components/input/markdown/MarkdownViewer'
import AnswerField from '@/components/answer/exactMatch/AnswerField'

const AnswerExactMatch = ({
  answer,
  question,
  evaluationId,
  questionId,
  onAnswerChange,
}) => {
  const { exactMatch: savedAnswers } = answer
  console.log(JSON.stringify(answer))

  const [studentAnswers, setStudentAnswers] = useState(savedAnswers.fields)

  useEffect(() => {
    setStudentAnswers(savedAnswers.fields)
  }, [savedAnswers.fields, setStudentAnswers])

  const onFieldChange = useCallback(async (fieldId, value) => {
    const response = await fetch(
      `/api/evaluations/${evaluationId}/questions/${questionId}/answers/exact-match/fields/`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ fieldId, value }),
      },
    )

    const ok = response.ok
    const data = await response.json()
    onAnswerChange(ok, data)
  }, [evaluationId, onAnswerChange, questionId])

  const { exactMatch } = question

  return (
    <Stack direction={'column'} width={'100%'} spacing={2}>
      {exactMatch.fields.map((field, index) => {
        const studentAnswer = studentAnswers.find((a) => a.fieldId === field.id)
        if (!studentAnswer) {
          console.error(`No answer found for field ${field.id}`) // TODO remove this line
          return null
        }
        return (
        <Stack key={field.id} direction={'column'} width={'100%'}>
          <MarkdownViewer content={field.statement} />
          <AnswerField fieldId={field.id} value={studentAnswer.value} onValueChange={onFieldChange} />
        </Stack>
      )
      })}
    </Stack>
  )
}

export default AnswerExactMatch
