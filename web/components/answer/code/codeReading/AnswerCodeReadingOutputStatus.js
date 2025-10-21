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
import StatusDisplay from '@/components/feedback/StatusDisplay'
import { Stack } from '@mui/material'

const AnswerCodeReadingOutputStatus = ({
  studentOutputTest = false,
  status,
}) => {
  return (
    <Stack direction={'row'} spacing={1}>
      {!studentOutputTest && <StatusDisplay status={'CLI'} />}
      {studentOutputTest && <StatusDisplay status={status} />}
    </Stack>
  )
}

export default AnswerCodeReadingOutputStatus
