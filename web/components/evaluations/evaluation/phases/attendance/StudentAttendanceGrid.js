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
import { Box, Stack, Typography } from '@mui/material'

import UserAvatar from '@/components/layout/UserAvatar'
import Datagrid from '@/components/ui/DataGrid'
import DateTimeCell from '@/components/layout/utils/DateTimeCell'
import StatusDisplay from '@/components/feedback/StatusDisplay'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'
import ButtonAddToAccessList from './ButtonAddToAccessList'

const StudentAttendanceGrid = ({
  groupScope,
  evaluationId,
  title,
  students,
  restrictedAccess,
  accessList,
  onStudentAllowed,
}) => {
  const isStudentProhibited = (studentEmail) =>
    restrictedAccess && !accessList?.includes(studentEmail)

  const columns = [
    {
      label: 'Student',
      column: { minWidth: 230, flexGrow: 1 },
      renderCell: (row) => (
        <Stack
          direction={'row'}
          spacing={1}
          alignItems={'center'}
          justifyContent={'space-between'}
        >
          <UserAvatar user={row.user} />
          {isStudentProhibited(row.user.email) && (
            <Stack direction="row" spacing={2} alignItems="center">
              <UserHelpPopper
                alwaysShow
                label={'Prohibited'}
                placement="left"
                mode="warning"
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <StatusDisplay status="PROHIBITED" size={24} />
                  <Box>
                    <Typography variant="body1">
                      Student Participation Prohibited
                    </Typography>
                    <Typography variant="body2">
                      This student registered before the access restriction was
                      set.
                    </Typography>
                    <Typography variant="body2">
                      To allow participation, please add the student to the
                      access list.
                    </Typography>
                  </Box>
                </Stack>
              </UserHelpPopper>
              <ButtonAddToAccessList
                groupScope={groupScope}
                evaluationId={evaluationId}
                studentEmail={row.user.email}
                onStudentAllowed={onStudentAllowed}
              />
            </Stack>
          )}
        </Stack>
      ),
    },

    {
      label: 'Registered',
      column: { minWidth: 90, width: 90 },
      renderCell: (row) => <DateTimeCell dateTime={row.registeredAt} />,
    },
  ]

  return (
    <Stack>
      <Typography variant="h6">{title}</Typography>
      <Datagrid
        header={{ columns: columns }}
        items={students?.map((student) => ({
          ...student,
          meta: {
            key: student.user.id,
          },
        }))}
      />
    </Stack>
  )
}

export default StudentAttendanceGrid
