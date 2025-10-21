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
import CheckboxLabel from '@/components/input/CheckboxLabel'
import { Stack } from '@mui/system'

const MultipleChoiceConfig = ({ multipleChoice }) => {
  return (
    <Stack spacing={2} direction={'row'}>
      <CheckboxLabel
        label="Comment is required"
        checked={multipleChoice.activateStudentComment}
        disabled
      />
      <CheckboxLabel
        label={`Selection limit (${multipleChoice.selectionLimit})`}
        checked={multipleChoice.activateSelectionLimit}
        disabled
      />
    </Stack>
  )
}

export default MultipleChoiceConfig
