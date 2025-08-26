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
import { Stack } from '@mui/material'
import MarkdownViewer from '@/components/input/markdown/MarkdownViewer'
import ScrollContainer from '@/components/layout/ScrollContainer'
import { MultiLineTextField } from '@/components/input/MultiLineTextFields'

const ConsultExactMatch = ({ exactMatch, answer }) => {
  return (
    <Stack p={2} pt={2} height={'100%'} spacing={2}>
      <ScrollContainer>
        <Stack spacing={2} width={'100%'}>
          {exactMatch.fields.map((field) => {
            let { value: fieldAnswer } = answer.fields.find(
              (ans) => ans.fieldId === field.id,
            ) || { value: '' }
            return (
              <Stack key={field.id} spacing={1} width={'100%'} pb={2}>
                <MarkdownViewer content={field.statement} />
                <MultiLineTextField
                  label={'Answer'}
                  multiline
                  variant="standard"
                  fullWidth
                  value={fieldAnswer || ''}
                />
              </Stack>
            )
          })}
        </Stack>
      </ScrollContainer>
    </Stack>
  )
}

export default ConsultExactMatch
