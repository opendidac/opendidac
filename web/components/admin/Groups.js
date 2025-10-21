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

import { fetcher } from '@/code/utils'
import Loading from '../feedback/Loading'
import useSWR from 'swr'
import UserAvatar from '../layout/UserAvatar'
import DataGrid from '../ui/DataGrid'
import { Box, Stack, Typography } from '@mui/material'
import { useCallback, useState } from 'react'
import { LoadingButton } from '@mui/lab'
import ScrollContainer from '../layout/ScrollContainer'
import { useSnackbar } from '@/context/SnackbarContext'

const Groups = () => {
  const {
    data,
    error: errorGroups,
    mutate,
    isValidating,
  } = useSWR('/api/groups', fetcher, {
    revalidateOnFocus: false,
  })

  const groups = data?.groups || []
  const [joiningGroupId, setJoiningGroupId] = useState(null)
  const { showTopCenter: showSnackbar } = useSnackbar()

  const handleJoinGroup = useCallback(
    async (groupId) => {
      setJoiningGroupId(groupId)

      try {
        // Get current user info first
        const userResponse = await fetch('/api/auth/session')
        const session = await userResponse.json()

        if (!session?.user) {
          showSnackbar('You must be logged in to join a group', 'error')
          return
        }

        // Join the group using the existing members endpoint
        const response = await fetch(`/api/groups/${groupId}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            member: {
              id: session.user.id,
            },
          }),
        })

        if (response.ok) {
          showSnackbar('Successfully joined the group!', 'success')
          // Refresh the groups data
          mutate()
        } else {
          const errorData = await response.json()
          showSnackbar(errorData.message || 'Failed to join group', 'error')
        }
      } catch (error) {
        console.error('Error joining group:', error)
        showSnackbar('An error occurred while joining the group', 'error')
      } finally {
        setJoiningGroupId(null)
      }
    },
    [showSnackbar, mutate],
  )

  return (
    <Stack width="100%" height={'100%'} p={2} spacing={1}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box flex={1}>
          <Typography variant="h6">Groups Management</Typography>
        </Box>
        <Box minWidth="100px">
          <Typography variant="h6">{groups.length} groups</Typography>
        </Box>
      </Stack>
      <Loading loading={isValidating} error={errorGroups}>
        <ScrollContainer>
          <Stack spacing={2}>
            <DataGrid
              header={{
                actions: {
                  label: 'Actions',
                  width: '120px',
                },
                columns: [
                  {
                    label: 'Label',
                    column: { minWidth: '200px', flexGrow: 1 },
                    renderCell: (row) => {
                      return (
                        <Typography variant="body1" fontWeight="medium">
                          {row.label}
                        </Typography>
                      )
                    },
                  },
                  {
                    label: 'Members',
                    column: { width: '100px' },
                    renderCell: (row) => {
                      return (
                        <Typography variant="body2" color="text.secondary">
                          {row._count.members}
                        </Typography>
                      )
                    },
                  },
                  {
                    label: 'Questions',
                    column: { width: '100px' },
                    renderCell: (row) => {
                      return (
                        <Typography variant="body2" color="text.secondary">
                          {row._count.questions}
                        </Typography>
                      )
                    },
                  },
                  {
                    label: 'Evaluations',
                    column: { width: '100px' },
                    renderCell: (row) => {
                      return (
                        <Typography variant="body2" color="text.secondary">
                          {row._count.evaluations}
                        </Typography>
                      )
                    },
                  },
                  {
                    label: 'Created By',
                    column: { width: '280px' },
                    renderCell: (row) => {
                      return (
                        row.createdBy && <UserAvatar user={row.createdBy} />
                      )
                    },
                  },
                  {
                    label: 'Created',
                    column: { width: '140px' },
                    renderCell: (row) => {
                      return (
                        <Typography variant="body2" color="text.secondary">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </Typography>
                      )
                    },
                  },
                ],
              }}
              items={groups?.map((group) => ({
                ...group,
                meta: {
                  key: group.id,
                  actions: !group.isCurrentUserMember
                    ? [
                        <LoadingButton
                          key="join"
                          color="primary"
                          variant="text"
                          size="small"
                          loading={joiningGroupId === group.id}
                          onClick={() => handleJoinGroup(group.id)}
                        >
                          Join
                        </LoadingButton>,
                      ]
                    : [],
                },
              }))}
            />
          </Stack>
        </ScrollContainer>
      </Loading>
    </Stack>
  )
}

export default Groups
