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
import { useCallback, useState } from 'react'
import BottomCollapsiblePanel from '@/components/layout/utils/BottomCollapsiblePanel'
import CodeCheck from '@/components/question/type_specific/code/codeWriting/CodeCheck'
import FileEditor from '@/components/question/type_specific/code/FileEditor'
import StudentPermissionIcon from '@/components/feedback/StudentPermissionIcon'
import { StudentPermission } from '@prisma/client'

import { useDebouncedCallback } from 'use-debounce'

const AnswerCodeWriting = ({
  evaluationId,
  questionId,
  question,
  answer,
  onAnswerChange,
}) => {
  const [lockCodeCheck, setLockCodeCheck] = useState(false)

  const onFileChange = useCallback(
    async (file) => {
      setLockCodeCheck(true)
      const response = await fetch(
        `/api/users/evaluations/${evaluationId}/questions/${questionId}/answers/code/code-writing/${file.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file }),
        },
      )
      const ok = response.ok
      const data = await response.json()
      setLockCodeCheck(false)
      onAnswerChange && onAnswerChange(ok, data)
    },
    [evaluationId, questionId, onAnswerChange],
  )

  const debouncedOnChange = useDebouncedCallback(onFileChange, 500)

  const codeCheckEnabled = question?.code?.codeWriting?.codeCheckEnabled ?? true

  return (
    answer?.code && (
      <BottomCollapsiblePanel
        bottomPanel={
          <CodeCheck
            enabled={codeCheckEnabled}
            lockCodeCheck={lockCodeCheck}
            codeCheckAction={() =>
              fetch(
                `/api/sandbox/evaluations/${evaluationId}/questions/${questionId}/student/code/code-writing`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                },
              )
            }
          />
        }
      >
        {answer?.code.codeWriting?.files?.map((answerToFile, index) => (
          <FileEditor
            key={index}
            file={answerToFile.file}
            readonlyPath
            readonlyContent={
              answerToFile.studentPermission === StudentPermission.VIEW
            }
            leftCorner={
              <StudentPermissionIcon
                permission={answerToFile.studentPermission}
              />
            }
            onChange={(file) => {
              setLockCodeCheck(true)
              debouncedOnChange(file)
            }}
          />
        ))}
      </BottomCollapsiblePanel>
    )
  )
}

export default AnswerCodeWriting
