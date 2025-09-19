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
import { Box, Card, CardContent, Typography, Avatar } from '@mui/material'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'
import DataGrid from '@/components/ui/DataGrid'

const ActiveProfessorsDisplay = ({ professors }) => {
  if (!professors || professors.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Professors
          </Typography>
          <Typography color="textSecondary">
            No active professors found for the selected academic year
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const header = {
    columns: [
      {
        label: 'Professor',
        tooltip: 'Professor name and email',
        column: { width: '40%' },
        renderCell: (professor) => (
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
              {professor.name ? professor.name.charAt(0).toUpperCase() : '?'}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {professor.name || 'Unknown'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {professor.email || 'No email'}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        label: 'Gradings Signed',
        tooltip: 'Number of gradings signed during the academic year',
        column: { width: '20%' },
        renderCell: (professor) => (
          <Typography variant="body2" fontWeight="medium">
            {professor.gradingCount}
          </Typography>
        ),
      },
      {
        label: 'First Grading',
        tooltip: 'Date of first grading signed',
        column: { width: '20%' },
        renderCell: (professor) => (
          <Typography variant="body2">
            {professor.firstGrading
              ? new Date(professor.firstGrading).toLocaleDateString()
              : '-'}
          </Typography>
        ),
      },
      {
        label: 'Last Grading',
        tooltip: 'Date of last grading signed',
        column: { width: '20%' },
        renderCell: (professor) => (
          <Typography variant="body2">
            {professor.lastGrading
              ? new Date(professor.lastGrading).toLocaleDateString()
              : '-'}
          </Typography>
        ),
      },
    ],
  }

  const items = professors.map((professor) => ({
    id: professor.id,
    ...professor,
    meta: {
      key: professor.id,
    },
  }))

  return (
    <Box sx={{ maxHeight: '70vh', width: '900px', overflow: 'auto' }}>
      <Card>
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6" gutterBottom>
              Active Professors ({professors.length})
            </Typography>
            <UserHelpPopper mode="info" size="small">
              <Box>
                <Typography variant="body2" paragraph>
                  Lists all professors who signed at least one grading during
                  the academic year. Each professor is shown with:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2">
                    Name and email
                  </Typography>
                  <Typography component="li" variant="body2">
                    Number of gradings signed
                  </Typography>
                  <Typography component="li" variant="body2">
                    First and last grading dates
                  </Typography>
                </Typography>
                <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                  This helps identify which professors are actively engaged in
                  the evaluation process.
                </Typography>
              </Box>
            </UserHelpPopper>
          </Box>

          <DataGrid header={header} items={items} enableSelection={false} />
        </CardContent>
      </Card>
    </Box>
  )
}

export default ActiveProfessorsDisplay
