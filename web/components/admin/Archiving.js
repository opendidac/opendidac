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
import DateTimeAgo from '../feedback/DateTimeAgo'
import useSWR from 'swr'
import DataGrid from '../ui/DataGrid'
import { Box, Stack, Typography, Menu } from '@mui/material'
import { Button } from '@mui/material'
import Image from 'next/image'
import DisplayPhase from '../evaluations/DisplayPhase'
import ArchivalWorkflowButton from './archiving/ArchivalWorkflowButton'
import ArchivingNavigation from './ArchivingNavigation'
import ScrollContainer from '../layout/ScrollContainer'
import { People } from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import { Role } from '@prisma/client'

// Group Members Widget Component
const GroupMembersWidget = ({ groupMembers }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const memberCount = groupMembers?.length || 0

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<People />}
        onClick={handleClick}
        sx={{ minWidth: 'auto', px: 1 }}
      >
        {memberCount}
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
            Group Members ({memberCount})
          </Typography>
          {memberCount > 0 ? (
            <Stack spacing={0.5}>
              {groupMembers.map((member, index) => (
                <Typography
                  key={member.user.id}
                  variant="body2"
                  color="text.secondary"
                >
                  {member.user.email}
                </Typography>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No members found
            </Typography>
          )}
        </Box>
      </Menu>
    </>
  )
}

const Archiving = ({ mode = 'todo' }) => {
  const {
    data,
    error: errorEvaluations,
    mutate,
    isValidating,
  } = useSWR(`/api/admin/archive?mode=${mode}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  })

  const [evaluations, setEvaluations] = useState([])

  useEffect(() => {
    if (data) {
      setEvaluations(
        data.map((evaluation) => ({
          ...evaluation,
          group: evaluation.group, // Keep the full group object
          groupScope: evaluation.group.scope, // Preserve the scope
        })),
      )
    } else {
      setEvaluations([])
    }
  }, [data])

  // Helper function for deadline checks (still needed for UI indicators)
  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  const handleArchivalTransition = async (evaluation, fromPhase, toPhase) => {
    if (
      toPhase === 'PURGED' ||
      toPhase === 'PURGED_WITHOUT_ARCHIVAL' ||
      toPhase === 'ARCHIVED'
    ) {
      // Trigger a full data refresh to get updated evaluation with relations
      mutate()
    } else {
      // For simple transitions like ACTIVE or MARKED_FOR_ARCHIVAL,
      // we can do an optimistic update
      const updatedEvaluation = {
        ...evaluation,
        archivalPhase: toPhase,
        ...(toPhase === 'ACTIVE' && {
          archivalDeadline: null,
        }),
      }

      // Update local state immediately
      setEvaluations((prevEvaluations) =>
        prevEvaluations.map((e) =>
          e.id === evaluation.id ? updatedEvaluation : e,
        ),
      )

      // Update SWR cache silently
      mutate((currentData) => {
        if (!currentData) return currentData
        return currentData.map((e) =>
          e.id === evaluation.id ? { ...e, archivalPhase: toPhase } : e,
        )
      }, false)
    }
  }

  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.roles?.includes(Role.SUPER_ADMIN)
  const isProfessor = session?.user?.roles?.includes(Role.PROFESSOR)

  return (
    <Stack width="100%" height={'100%'} bgcolor="white">
      {/* Navigation Tabs */}
      <ArchivingNavigation currentMode={mode} />

      <Stack p={1} spacing={1} flex={1}>
        <Loading loading={isValidating} error={errorEvaluations}>
          <ScrollContainer>
            {evaluations.length > 0 && (
              <DataGrid
                header={{
                  actions: {
                    label: 'Actions',
                    width: '330px',
                  },
                  columns: [
                    {
                      label: 'Label',
                      column: { flexGrow: 1, minWidth: '200px' },
                      renderCell: (row) => (
                        <Typography variant="body1" fontWeight="medium">
                          {row.label}
                        </Typography>
                      ),
                    },
                    {
                      label: 'Created',
                      column: { width: '180px' },
                      renderCell: (row) => (
                        <Stack direction="column" spacing={0.25}>
                          <DateTimeAgo date={new Date(row.createdAt)} />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(row.createdAt).toLocaleString()}
                          </Typography>
                        </Stack>
                      ),
                    },

                    {
                      label: 'Phase',
                      column: { width: '140px' },
                      renderCell: (row) => (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <DisplayPhase phase={row.phase} />
                          {row.purgedAt && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
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
                        </Stack>
                      ),
                    },
                    {
                      label: 'Schedule',
                      column: { width: '160px' },
                      renderCell: (row) => (
                        <Stack direction="column" spacing={0.5}>
                          {row.startAt && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              <b>Start:</b>{' '}
                              {new Date(row.startAt).toLocaleString()}
                            </Typography>
                          )}
                          {row.endAt && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              <b>End:</b> {new Date(row.endAt).toLocaleString()}
                            </Typography>
                          )}
                          {!row.startAt && !row.endAt && (
                            <Typography variant="caption" color="text.disabled">
                              No schedule
                            </Typography>
                          )}
                        </Stack>
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
                    {
                      label: 'Group',
                      column: { width: '200px' },
                      renderCell: (row) => (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '140px',
                            }}
                            title={row.group?.label || 'Unknown'}
                          >
                            {row.group?.label || 'Unknown'}
                          </Typography>
                          {row.group?.members && (
                            <GroupMembersWidget
                              groupMembers={row.group.members}
                            />
                          )}
                        </Stack>
                      ),
                    },
                  ],
                }}
                items={evaluations?.map((evaluation) => ({
                  ...evaluation,
                  meta: {
                    key: `evaluation-${evaluation.id}`,

                    actions: [
                      <Stack
                        direction="row"
                        spacing={1}
                        key="actions"
                        justifyContent={'flex-end'}
                      >
                        <ArchivalWorkflowButton
                          evaluation={evaluation}
                          onTransition={handleArchivalTransition}
                          size="small"
                        />
                        {isSuperAdmin || isProfessor ? (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              window.open(
                                `/${evaluation.groupScope}/evaluations/${evaluation.id}`,
                                '_blank',
                              )
                            }}
                            color="primary"
                          >
                            Open
                          </Button>
                        ) : null}
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
                      </Stack>,
                    ],
                  },
                }))}
              />
            )}
          </ScrollContainer>
        </Loading>
      </Stack>
    </Stack>
  )
}

export default Archiving
