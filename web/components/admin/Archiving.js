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
import UserHelpPopper from '../feedback/UserHelpPopper'
import useSWR from 'swr'
import GridGrouping from '../ui/GridGrouping'
import {
  Box,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
} from '@mui/material'
import { Button } from '@mui/material'
import Image from 'next/image'
import DisplayPhase from '../evaluations/DisplayPhase'
import ArchivalWorkflowButton from './archiving/ArchivalWorkflowButton'
import ScrollContainer from '../layout/ScrollContainer'
import { Warning, AccessTime, Info } from '@mui/icons-material'

// Filter Controls Component
const ArchivalFilters = ({
  archivalFilter,
  setArchivalFilter,
  breachFilter,
  setBreachFilter,
  filteredCount,
  totalCount,
}) => {
  return (
    <Box>
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight="medium">
          Data Lifecycle Filter
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Archival Phase</InputLabel>
            <Select
              value={archivalFilter}
              label="Archival Phase"
              onChange={(e) => setArchivalFilter(e.target.value)}
            >
              <MenuItem value="all">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Info fontSize="small" />
                  <span>All Phases</span>
                </Stack>
              </MenuItem>
              <MenuItem value="ACTIVE">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label="Active" color="primary" size="small" />
                </Stack>
              </MenuItem>
              <MenuItem value="MARKED_FOR_ARCHIVAL">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label="Marked for Archive"
                    color="warning"
                    size="small"
                  />
                </Stack>
              </MenuItem>
              <MenuItem value="ARCHIVED">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label="Archived" color="success" size="small" />
                </Stack>
              </MenuItem>
              <MenuItem value="EXCLUDED_FROM_ARCHIVAL">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label="Excluded" color="info" size="small" />
                </Stack>
              </MenuItem>
              <MenuItem value="PURGED">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label="Purged" color="error" size="small" />
                </Stack>
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Deadline Status</InputLabel>
            <Select
              value={breachFilter}
              label="Deadline Status"
              onChange={(e) => setBreachFilter(e.target.value)}
            >
              <MenuItem value="all">
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccessTime fontSize="small" />
                  <span>All Deadlines</span>
                </Stack>
              </MenuItem>
              <MenuItem value="archival_breach">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Warning fontSize="small" color="warning" />
                  <span>Archival Overdue</span>
                </Stack>
              </MenuItem>
              <MenuItem value="purge_breach">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Warning fontSize="small" color="error" />
                  <span>Purge Overdue</span>
                </Stack>
              </MenuItem>
              <MenuItem value="any_breach">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Warning fontSize="small" color="error" />
                  <span>Any Overdue</span>
                </Stack>
              </MenuItem>
              <MenuItem value="no_breach">
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccessTime fontSize="small" color="success" />
                  <span>On Schedule</span>
                </Stack>
              </MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            Showing {filteredCount} of {totalCount} evaluations
          </Typography>
        </Stack>

        {/* Active Filters Display */}
        {(archivalFilter !== 'all' || breachFilter !== 'all') && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Active filters:
            </Typography>
            {archivalFilter !== 'all' && (
              <Chip
                label={`Phase: ${archivalFilter.replace('_', ' ')}`}
                size="small"
                onDelete={() => setArchivalFilter('all')}
                color="primary"
                variant="outlined"
              />
            )}
            {breachFilter !== 'all' && (
              <Chip
                label={`Deadline: ${breachFilter.replace('_', ' ')}`}
                size="small"
                onDelete={() => setBreachFilter('all')}
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>
        )}
      </Stack>

      <Divider sx={{ mt: 2 }} />
    </Box>
  )
}

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
  const [filteredEvaluations, setFilteredEvaluations] = useState([])
  const [archivalFilter, setArchivalFilter] = useState('all')
  const [breachFilter, setBreachFilter] = useState('all')

  useEffect(() => {
    if (data) {
      setEvaluations(
        data.map((evaluation) => ({
          ...evaluation,
          group: evaluation.group.label,
          groupScope: evaluation.group.scope, // Preserve the scope
        })),
      )
    } else {
      setEvaluations([])
    }
  }, [data])

  // Helper functions for deadline checks
  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  const getArchivalPhaseOrDefault = (evaluation) => {
    return evaluation.archivalPhase || 'ACTIVE'
  }

  // Filter evaluations based on archival phase and deadline breaches
  useEffect(() => {
    if (!evaluations || evaluations.length === 0) {
      setFilteredEvaluations([])
      return
    }

    let filtered = evaluations

    // Filter by archival phase
    if (archivalFilter !== 'all') {
      filtered = filtered.filter((evaluation) => {
        const phase = getArchivalPhaseOrDefault(evaluation)
        return phase === archivalFilter
      })
    }

    // Filter by deadline breaches
    if (breachFilter !== 'all') {
      filtered = filtered.filter((evaluation) => {
        const archivalPassed = isDeadlinePassed(evaluation.archivalDeadline)
        const purgePassed = isDeadlinePassed(evaluation.purgeDeadline)

        switch (breachFilter) {
          case 'archival_breach':
            return archivalPassed
          case 'purge_breach':
            return purgePassed
          case 'any_breach':
            return archivalPassed || purgePassed
          case 'no_breach':
            return !archivalPassed && !purgePassed
          default:
            return true
        }
      })
    }

    setFilteredEvaluations(filtered)
  }, [evaluations, archivalFilter, breachFilter])

  const handleArchivalTransition = (evaluation, fromPhase, toPhase) => {
    console.log(
      `Transitioning evaluation ${evaluation.id} from ${fromPhase} to ${toPhase}`,
    )
    // The workflow button now handles its own form, so we just need to refresh data
    mutate() // Refresh the data
  }

  return (
    <Stack width="100%" height={'100%'} p={2} spacing={1}>
      {/* Filter Controls */}
      <ArchivalFilters
        archivalFilter={archivalFilter}
        setArchivalFilter={setArchivalFilter}
        breachFilter={breachFilter}
        setBreachFilter={setBreachFilter}
        filteredCount={filteredEvaluations.length}
        totalCount={evaluations.length}
      />
      <Stack flex={1}>
        <Loading loading={isValidating} error={errorEvaluations}>
          <ScrollContainer>
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
                    column: { width: '320px' },
                    renderCell: (row) => (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <DisplayPhase phase={row.phase} />
                        {row.purgedAt && (
                          <Typography variant="caption" color="text.secondary">
                            <b>purged</b>
                          </Typography>
                        )}
                        {/* Deadline breach indicators */}
                        {isDeadlinePassed(row.archivalDeadline) && (
                          <UserHelpPopper
                            mode="warning"
                            label="Archival Overdue"
                            size="small"
                            placement="top"
                          >
                            <Typography variant="body2">
                              This evaluation&apos;s archival deadline has
                              passed. Consider archiving it immediately or
                              setting a new deadline.
                            </Typography>
                          </UserHelpPopper>
                        )}
                        {isDeadlinePassed(row.purgeDeadline) && (
                          <UserHelpPopper
                            mode="error"
                            label="Purge Overdue"
                            size="small"
                            placement="top"
                          >
                            <Typography variant="body2">
                              This evaluation&apos;s purge deadline has passed.
                              The student data should be permanently deleted.
                            </Typography>
                          </UserHelpPopper>
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
              items={filteredEvaluations?.map((evaluation) => ({
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
          </ScrollContainer>
        </Loading>
      </Stack>
    </Stack>
  )
}

export default Archiving
