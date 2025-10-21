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
import { Stack } from '@mui/material'

import Loading from '../../feedback/Loading'

import { fetcher } from '../../../code/utils'
import { CodeQuestionType } from '@prisma/client'
import CodeWriting from './code/codeWriting/CodeWriting'
import CodeReading from './code/codeReading/CodeReading'

const Code = ({ groupScope, questionId, onUpdate }) => {
  const { data: code, error } = useSWR(
    `/api/${groupScope}/questions/${questionId}/code`,
    groupScope && questionId ? fetcher : null,
    { revalidateOnFocus: false },
  )

  return (
    <Loading loading={!code} errors={[error]}>
      <Stack overflow={'hidden'} flex={1}>
        {code?.codeType === CodeQuestionType.codeWriting && (
          <CodeWriting
            groupScope={groupScope}
            questionId={questionId}
            language={code.language}
            onUpdate={onUpdate}
          />
        )}
        {code?.codeType === CodeQuestionType.codeReading && (
          <CodeReading
            groupScope={groupScope}
            questionId={questionId}
            language={code.language}
            onUpdate={onUpdate}
          />
        )}
      </Stack>
    </Loading>
  )
}

export default Code
