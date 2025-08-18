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
import React, { useState, useEffect } from 'react'
import { fetcher } from '@/code/utils'
import Loading from '../feedback/Loading'
import useSWR from 'swr'
import GridGrouping from '../ui/GridGrouping'
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material'
import ArchiveIcon from '@mui/icons-material/Archive'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { Button } from '@mui/material'
import Image from 'next/image'
import DateTimeAgo from '../feedback/DateTimeAgo'
import DisplayPhase from '../evaluations/DisplayPhase'
import ArchivalWorkflowButton from '../evaluations/shared/ArchivalWorkflowButton'

const Archiving = () => {
  const {
    data,
    error: errorEvaluations,
    mutate,
    isValidating,
  } = useSWR('/api/admin/archive', fetcher, {
    revalidateOnFocus: false,
  })

  const [evaluations, setEvaluations] = useState([])

  useEffect(() => {
    if (data) {
      setEvaluations(data.map(evaluation => ({
        ...evaluation,
        group: evaluation.group.label,
        groupScope: evaluation.group.scope  // Preserve the scope
      })))
    } else {
      setEvaluations([])
    }
  }, [data])

  const handleArchivalTransition = (evaluation, fromPhase, toPhase) => {
    console.log(`Transitioning evaluation ${evaluation.id} from ${fromPhase} to ${toPhase}`)
    // The workflow button now handles its own form, so we just need to refresh data
    mutate() // Refresh the data
  }



  return (
    <Box
      sx={{
        minWidth: '100%',
        height: '100%',
        p: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Loading loading={isValidating} error={errorEvaluations}>
        <GridGrouping
          label="Evaluation Management"
          header={{
            actions: {
              label: 'Actions',
              width: '300px',
            },
            columns: [
              {
                label: 'Label',
                column: { flexGrow: 1 },
                renderCell: (row) => (
                  <Typography variant="body1" fontWeight="medium">
                    {row.label}
                  </Typography>
                ),
              },
              {
                label: 'Phase',
                column: { width: '130px' },
                renderCell: (row) => (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DisplayPhase phase={row.phase} />
                    {row.purgedAt && (
                      <Typography variant="caption" color="error">
                        <b>purged</b>
                      </Typography>
                    )}
                  </Stack>
                ),
              },
              {
                label: 'Questions',
                column: { width: '80px' },
                renderCell: (row) => (
                  <Typography variant="body2" color="text.secondary">
                    {row._count?.evaluationToQuestions || 0}
                  </Typography>
                ),
              },
              {
                label: 'Students',
                column: { width: '80px' },
                renderCell: (row) => (
                  <Typography variant="body2" color="text.secondary">
                    {row._count?.students || 0}
                  </Typography>
                ),
              },

            ],
          }}
          items={evaluations?.map((evaluation) => ({
            ...evaluation,
            meta: {
              key: `evaluation-${evaluation.id}`,
              
              actions: [
                <Stack direction="row" spacing={1} key="actions">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      window.open(
                        `/api/${evaluation.groupScope}/evaluations/${evaluation.id}/export`,
                        '_blank',
                      )
                    }}
                    startIcon={
                      <Image
                        alt="Export"
                        src="/svg/icons/file-pdf.svg"
                        width="16"
                        height="16"
                      />
                    }
                  >
                    PDF
                  </Button>
                  <ArchivalWorkflowButton
                    evaluation={evaluation}
                    onTransition={handleArchivalTransition}
                    size="small"
                  />
                </Stack>,
              ],
            },
          }))}
          groupings={[
            {
              groupBy: 'group',
              option: 'Group',
              type: 'element',
              renderLabel: (row) => (
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {row.label}
                  </Typography>
                </Box>
              ),
            },
          ]}
        />
      </Loading>

      {/* TODO: Add other archival dialogs */}
    </Box>
  )
}

export default Archiving
