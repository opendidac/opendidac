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
import React, { useCallback} from 'react'
import { useDebouncedCallback } from 'use-debounce'
import MarkdownEditor from '@/components/input/markdown/MarkdownEditor'

const AnswerExactAnswer = ({ answer, evaluationId, questionId, onAnswerChange }) => {
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
      <MarkdownEditor
        id={`answer-editor-${questionId}`}
        rawContent={"42"}
        onChange={(newContent) => {
          // debouncedOnChange(newContent)
        }}
      />
  )
}

export default AnswerExactAnswer
