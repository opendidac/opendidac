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

import { Box, Typography, Chip } from '@mui/material'
import DataGrid from '@/components/ui/DataGrid'

const EvaluationsDialogContent = ({ evaluations }) => {
  if (!evaluations || evaluations.length === 0) {
    return (
      <Typography color="textSecondary" sx={{ p: 2 }}>
        No evaluations found for the selected academic year
      </Typography>
    )
  }

  const header = {
    columns: [
      {
        label: 'Evaluation',
        tooltip: 'Evaluation title and group',
        column: { width: '45%' },
        renderCell: (evaluation) => (
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {evaluation.label || 'Untitled Evaluation'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Group: {evaluation.group?.label || 'Unknown Group'}
            </Typography>
          </Box>
        ),
      },
      {
        label: 'Phase',
        tooltip: 'Evaluation phase',
        column: { width: '15%' },
        renderCell: (evaluation) => (
          <Chip
            label={evaluation.phase}
            size="small"
            color={
              evaluation.phase === 'FINISHED'
                ? 'success'
                : evaluation.phase === 'GRADING'
                  ? 'warning'
                  : evaluation.phase === 'IN_PROGRESS'
                    ? 'info'
                    : 'default'
            }
            variant="outlined"
          />
        ),
      },
      {
        label: 'Students',
        tooltip: 'Number of students registered',
        column: { width: '15%' },
        renderCell: (evaluation) => (
          <Typography variant="body2" fontWeight="medium">
            {evaluation.students?.length || 0}
          </Typography>
        ),
      },
      {
        label: 'Created ↓',
        tooltip: 'Date when evaluation was created (sorted newest first)',
        column: { width: '15%' },
        renderCell: (evaluation) => (
          <Typography variant="body2">
            {evaluation.createdAt
              ? new Date(evaluation.createdAt).toLocaleDateString()
              : '-'}
          </Typography>
        ),
      },
    ],
  }

  const items = evaluations.map((evaluation) => ({
    id: evaluation.id,
    ...evaluation,
    meta: {
      key: evaluation.id,
    },
  }))

  return (
    <Box sx={{ maxHeight: '70vh', width: '900px', overflow: 'auto' }}>
      <DataGrid header={header} items={items} enableSelection={false} />
    </Box>
  )
}

export default EvaluationsDialogContent
