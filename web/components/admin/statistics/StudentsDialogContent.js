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
import { Box, Typography, Avatar } from '@mui/material'
import DataGrid from '@/components/ui/DataGrid'

const StudentsDialogContent = ({ students }) => {
  if (!students || students.length === 0) {
    return (
      <Typography color="textSecondary" sx={{ p: 2 }}>
        No active students found for the selected academic year
      </Typography>
    )
  }

  const header = {
    columns: [
      {
        label: 'Student',
        tooltip: 'Student name and email',
        column: { width: '25%' },
        renderCell: (student) => (
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
              {student.name ? student.name.charAt(0).toUpperCase() : '?'}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {student.name || 'Unknown'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {student.email || 'No email'}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        label: 'Evaluations Registered',
        tooltip: 'Number of evaluations registered to during the academic year',
        column: { width: '25%' },
        renderCell: (student) => (
          <Typography variant="body2" fontWeight="medium">
            {student.evaluationCount}
          </Typography>
        ),
      },
      {
        label: 'First Registration',
        tooltip: 'Date of first evaluation registration',
        column: { width: '25%' },
        renderCell: (student) => (
          <Typography variant="body2">
            {student.firstParticipation
              ? new Date(student.firstParticipation).toLocaleDateString()
              : '-'}
          </Typography>
        ),
      },
      {
        label: 'Last Registration',
        tooltip: 'Date of last evaluation registration',
        column: { width: '25%' },
        renderCell: (student) => (
          <Typography variant="body2">
            {student.lastParticipation
              ? new Date(student.lastParticipation).toLocaleDateString()
              : '-'}
          </Typography>
        ),
      },
    ],
  }

  const items = students.map((student) => ({
    id: student.id,
    ...student,
    meta: {
      key: student.id,
    },
  }))

  return (
    <Box sx={{ maxHeight: '70vh', width: '900px', overflow: 'auto' }}>
      <DataGrid header={header} items={items} enableSelection={false} />
    </Box>
  )
}

export default StudentsDialogContent
