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
import { useSnackbar } from '@/context/SnackbarContext'
import { Stack, Typography } from '@mui/material'
import EvaluationTitleBar from '../layout/EvaluationTitleBar'
import JoinClipboard from '../../JoinClipboard'
import StudentsInEvaluation from './attendance/StudentsInEvaluation'
import DeniedStudentsInEvaluation from './attendance/DeniedStudentsInEvaluation'

const EvaluationAttendance = ({
  groupScope,
  evaluation,
  attendance,
  onAttendanceChanged,
}) => {
  const evaluationId = evaluation.id

  const { show: showSnackbar } = useSnackbar()

  return (
    <Stack flex={1} px={1}>
      <EvaluationTitleBar
        title="Attendance"
        action={<JoinClipboard evaluationId={evaluationId} />}
      />
      <Stack spacing={1} direction={'row'} width={'100%'}>
        <Stack flex={1}>
          <Typography variant="h6">Registered Students</Typography>
          <StudentsInEvaluation
            groupScope={groupScope}
            evaluationId={evaluationId}
            students={attendance.registered}
          />
        </Stack>
        {attendance.denied.length > 0 && (
          <Stack flex={1}>
            <Typography variant="h6">Denied Students</Typography>
            <DeniedStudentsInEvaluation
              groupScope={groupScope}
              evaluationId={evaluationId}
              students={attendance.denied}
              onStudentAllowed={async (_) => {
                onAttendanceChanged()
                showSnackbar('Student has been included in the access list')
              }}
            />
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}

export default EvaluationAttendance
