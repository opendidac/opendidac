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
import { useState, useEffect, useCallback } from 'react'
import { Role } from '@prisma/client'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

import { Box, Button, Stack, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'

import { fetcher } from '@/code/utils'
import { useGroup } from '@/context/GroupContext'

import LayoutMain from '@/components/layout/LayoutMain'
import LayoutSplitScreen from '@/components/layout/LayoutSplitScreen'

import Authorization from '@/components/security/Authorization'
import Loading from '@/components/feedback/Loading'
import AlertFeedback from '@/components/feedback/AlertFeedback'
import DialogFeedback from '@/components/feedback/DialogFeedback'

import AddGroupDialog from '../list/AddGroupDialog'
import AddMemberDialog from '../list/AddMemberDialog'
import MyGroupsGrid from '../list/MyGroupsGrid'
import GroupMembersGrid from '../list/GroupMembersGrid'

const PageList = () => {
  const { data: session } = useSession()
  const router = useRouter()

  const { groups, mutate: mutateGroups } = useGroup()

  const [selectedGroup, setSelectedGroup] = useState()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [addGroupDialogOpen, setAddGroupDialogOpen] = useState(false)
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)

  const {
    data: group,
    error,
    mutate,
  } = useSWR(
    `/api/groups/${selectedGroup && selectedGroup.id}/members`,
    selectedGroup ? fetcher : null,
  )

  useEffect(() => {
    if (!selectedGroup && groups && groups.length > 0) {
      setSelectedGroup(groups[0].group)
    }
  }, [groups, selectedGroup])

  const handleSelfRemoved = useCallback(
    async (groupId) => {
      // Refresh groups, then select the first group (top of the list)
      const updated = await mutateGroups()
      const newGroups = updated || groups
      if (newGroups && newGroups.length > 0) {
        setSelectedGroup(newGroups[0].group)
      } else {
        setSelectedGroup(null)
      }
    },
    [mutateGroups, groups],
  )

  const handleDeleteGroup = useCallback(async () => {
    if (!group) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        setDeleting(false)
        setDeleteDialogOpen(false)
        return
      }
      await mutateGroups()
      setSelectedGroup(null)
      await mutate()
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }, [group, mutate, mutateGroups])

  return (
    <Authorization allowRoles={[Role.PROFESSOR]}>
      <Loading loading={!group} errors={[error]}>
        <LayoutMain
          header={
            <Box>
              <Link href={'/'}>
                <Button startIcon={<ArrowBackIosIcon />}>Back</Button>
              </Link>
            </Box>
          }
        >
          <LayoutSplitScreen
            leftPanel={
              <>
                <Stack
                  direction={'row'}
                  alignItems={'center'}
                  justifyContent={'space-between'}
                  sx={{ p: 1 }}
                >
                  <Typography variant="h6">My Groups</Typography>
                  <Button onClick={() => setAddGroupDialogOpen(true)}>
                    Create a new group
                  </Button>
                </Stack>
                <MyGroupsGrid
                  groups={groups}
                  selectedGroup={selectedGroup}
                  onSelected={(group) => {
                    setSelectedGroup(group)
                  }}
                />
              </>
            }
            rightPanel={
              group ? (
                <>
                  <Stack
                    direction={'row'}
                    alignItems={'center'}
                    justifyContent={'space-between'}
                    sx={{ p: 1 }}
                  >
                    <Typography variant="h6">
                      Members of {group && group.label}
                    </Typography>
                    <Stack direction={'row'} spacing={1}>
                      {session?.user?.id === group.createdById && (
                        <LoadingButton
                          color="error"
                          variant="contained"
                          loading={deleting}
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          Delete this group
                        </LoadingButton>
                      )}
                      <Button onClick={() => setAddMemberDialogOpen(true)}>
                        Add a new member
                      </Button>
                    </Stack>
                  </Stack>
                  <GroupMembersGrid
                    group={group}
                    onUpdate={async (scope) => {
                      await mutate()
                      await mutateGroups()
                    }}
                    onSelfRemoved={handleSelfRemoved}
                  />
                </>
              ) : (
                <Stack p={2}>
                  <AlertFeedback severity="info">
                    <Typography variant="body1">
                      Select a group on the left to view its members.
                    </Typography>
                  </AlertFeedback>
                </Stack>
              )
            }
          />

          <AddGroupDialog
            open={addGroupDialogOpen}
            onClose={() => setAddGroupDialogOpen(false)}
          />

          <AddMemberDialog
            group={group}
            open={addMemberDialogOpen}
            onClose={() => setAddMemberDialogOpen(false)}
            onSuccess={async () => await mutate()} // force refresh
          />
          {deleteDialogOpen && (
            <DialogFeedback
              open={deleteDialogOpen}
              title={`Delete group ${group?.label}?`}
              content={
                <Typography variant="body2">
                  This will delete all the related data, including questions and
                  evaluations.
                </Typography>
              }
              onClose={() => setDeleteDialogOpen(false)}
              onConfirm={handleDeleteGroup}
              confirmButtonProps={{ color: 'error' }}
            />
          )}
        </LayoutMain>
      </Loading>
    </Authorization>
  )
}

export default PageList
