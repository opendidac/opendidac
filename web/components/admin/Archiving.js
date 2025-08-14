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
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useSnackbar } from '@/context/SnackbarContext'
import ArchiveIcon from '@mui/icons-material/Archive'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'

const Archiving = () => {
  const {
    data,
    error: errorEvaluations,
    mutate,
    isValidating,
  } = useSWR('/api/admin/archive', fetcher, {
    revalidateOnFocus: false,
  })



  const [ evaluations, setEvaluations ] = useState([])

  useEffect(() => {
    setEvaluations(data?.map(evaluation => ({
      ...evaluation,
      group: evaluation.group.label
    })))
  }, [data])

  // print first 10 evaluations
  console.log("evaluations", evaluations.slice(0, 10))
  

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
              width: '200px',
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
                label: 'Created',
                column: { width: '140px' },
                renderCell: (row) => (
                  <Typography variant="body2" color="text.secondary">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </Typography>
                ),
              },
              {
                label: 'Purged',
                column: { width: '140px' },
                renderCell: (row) => (
                  <Typography variant="body2" color="text.secondary">
                    {row.purgedAt
                      ? new Date(row.purgedAt).toLocaleDateString()
                      : 'N/A'}
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
                <React.Fragment key="actions">
                  {!evaluation.archivedAt && (
                    <Tooltip title="Archive evaluation" key="archive">
                      <IconButton
                        onClick={(ev) => {
                          ev.preventDefault()
                          ev.stopPropagation()
                          // Handle archive action
                        }}
                      >
                        <ArchiveIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {evaluation.archivedAt && !evaluation.purgedAt && (
                    <Tooltip title="Purge evaluation" key="purge">
                      <IconButton
                        onClick={(ev) => {
                          ev.preventDefault()
                          ev.stopPropagation()
                          // Handle purge action
                        }}
                      >
                        <DeleteForeverIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </React.Fragment>,
              ],
            },
          }))}
          groupings={[
            {
              groupBy: 'group',
              option: 'Group',
              type: 'element',
              renderLabel: (row) => {
                console.log(row)
                return (<Box>
                  <Typography variant="body1" fontWeight="medium">
                    {row.group}
                  </Typography>
                </Box>)
              }

            },
          ]}
        />
      </Loading>
    </Box>
  )
}

export default Archiving
