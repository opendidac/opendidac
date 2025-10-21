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
import { useCallback, useEffect, useState } from 'react'
import { Stack, Button } from '@mui/material'
import ScrollContainer from '@/components/layout/ScrollContainer'
import { useTheme } from '@emotion/react'
import { useDebouncedCallback } from 'use-debounce'
import SnippetStatuBar from '@/components/question/type_specific/code/codeReading/SnippetStatuBar'
import AnswerCodeReadingOutput from './AnswerCodeReadingOutput'
import AnswerCodeReadingOutputStatus from './AnswerCodeReadingOutputStatus'
import { StudentAnswerCodeReadingOutputStatus } from '@prisma/client'

const AnswerCodeReading = ({
  evaluationId,
  questionId,
  question,
  answer,
  onAnswerChange,
}) => {
  const theme = useTheme()

  const studentOutputTest = question?.code?.codeReading?.studentOutputTest

  const [lockCodeReadingCheck, setLockCodeReadingCheck] = useState(false)

  const [outputs, setOutputs] = useState([])

  useEffect(() => setOutputs(answer?.code?.codeReading?.outputs), [answer])

  const onOutputChange = useCallback(
    async (snippetId, newOutput) => {
      setLockCodeReadingCheck(true)
      if (studentOutputTest) {
        setOutputs(
          outputs.map((output) => {
            if (output.codeReadingSnippet.id === snippetId) {
              return {
                ...output,
                status: StudentAnswerCodeReadingOutputStatus.NEUTRAL,
              }
            }
            return output
          }),
        )
      }
      const response = await fetch(
        `/api/users/evaluations/${evaluationId}/questions/${questionId}/answers/code/code-reading/${snippetId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ output: newOutput }),
        },
      )
      const ok = response.ok
      const data = await response.json()

      setLockCodeReadingCheck(false)
      onAnswerChange && onAnswerChange(ok, data)
    },
    [evaluationId, questionId, onAnswerChange, outputs, studentOutputTest],
  )

  const onOutputCheck = useCallback(async () => {
    setLockCodeReadingCheck(true)

    setOutputs(
      outputs.map((output) => ({
        ...output,
        status: 'LOADING',
      })),
    )

    const results = await fetch(
      `/api/users/evaluations/${evaluationId}/questions/${questionId}/answers/code/code-reading/check`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    ).then((res) => res.json())

    const newOutputs = outputs.map((output) => {
      const result = results.find(
        (r) => r.codeReadingSnippet.order === output.codeReadingSnippet.order,
      )
      return {
        ...output,
        status: result.status,
      }
    })
    setOutputs(newOutputs)
    setLockCodeReadingCheck(false)
  }, [evaluationId, questionId, outputs, setOutputs])

  const debouncedOnOutputChange = useDebouncedCallback(onOutputChange, 500)

  return (
    <Stack spacing={0} pt={1} height={'100%'}>
      {studentOutputTest && (
        <SnippetStatuBar statuses={outputs.map((output) => output.status)} />
      )}
      <Stack flex={1} height={'100%'} overflow={'auto'}>
        <ScrollContainer>
          {outputs.map((output, index) => (
            <AnswerCodeReadingOutput
              key={index}
              language={question.code.language}
              snippet={output.codeReadingSnippet.snippet}
              output={output.output}
              status={
                <AnswerCodeReadingOutputStatus
                  studentOutputTest={studentOutputTest}
                  status={output.status}
                />
              }
              onOutputChange={(newOutput) => {
                debouncedOnOutputChange(output.codeReadingSnippet.id, newOutput)
              }}
            />
          ))}
        </ScrollContainer>
      </Stack>
      {studentOutputTest && (
        <Stack
          alignItems={'flex-start'}
          py={2}
          px={1}
          borderTop={`1px solid ${theme.palette.divider}`}
          bgcolor={theme.palette.background.paper}
        >
          <Button
            id={'code-reading-check'}
            variant="contained"
            onClick={onOutputCheck}
            disabled={lockCodeReadingCheck}
            size={'small'}
          >
            Check
          </Button>
        </Stack>
      )}
    </Stack>
  )
}

export default AnswerCodeReading
