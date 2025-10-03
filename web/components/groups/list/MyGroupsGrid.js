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
import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Alert, Box, Button, Chip, Typography } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'

import DataGrid from '@/components/ui/DataGrid'
import AlertFeedback from '@/components/feedback/AlertFeedback'
import DialogFeedback from '@/components/feedback/DialogFeedback'

const MyGroupsGrid = ({ groups, onSelected, onLeave, onDelete }) => {
  const { data: session } = useSession()

  const [deleteGroupId, setDeleteGroupId] = useState(null)

  const leaveGroup = useCallback(
    async (groupId) => {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
        }),
      })

      if (response.status === 200) {
        onLeave && onLeave(groupId)
      }
    },
    [onLeave, session?.user?.id],
  )

  const deleteGroup = useCallback(
    async (groupId) => {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      })

      if (response.status === 200) {
        onDelete && onDelete(groupId)
      }
    },
    [onDelete],
  )

  const onDeleteGroup = useCallback(
    (groupId) => {
      setDeleteGroupId(groupId)
    },
    [setDeleteGroupId],
  )

  return (
    <Box sx={{ minWidth: '100%', pl: 2, pr: 2 }}>
      {session && groups && groups.length > 0 && (
        <DataGrid
          header={{
            actions: {
              label: '',
              width: '40px',
            },
            columns: [
              {
                label: 'Group',
                column: { flexGrow: 1 },
                renderCell: (row) => row.label,
              },
              {
                label: '',
                column: { width: '80px' },
                renderCell: (row) =>
                  row.createdById === session.user.id ? (
                    <Chip
                      size={'small'}
                      label="Owner"
                      variant={'filled'}
                      color={'warning'}
                    />
                  ) : (
                    <Chip
                      size={'small'}
                      label="Member"
                      variant={'outlined'}
                      color={'info'}
                    />
                  ),
              },
            ],
          }}
          items={groups.map(({ group }) => ({
            ...group,
            meta: {
              key: group.id,
              onClick: () => onSelected(group),
              collapsedActions: true,
              actions: getMyGroupsActions(
                group,
                session.user,
                leaveGroup,
                onDeleteGroup,
              ),
            },
          }))}
        />
      )}
      {groups && groups.length === 0 && (
        <AlertFeedback severity="info">
          <Typography variant="body1">
            You are not a member of any groups.
          </Typography>
        </AlertFeedback>
      )}
      <DialogFeedback
        open={deleteGroupId !== null}
        onClose={() => setDeleteGroupId(null)}
        title="Are you sure you want to delete this group?"
        content={
          <Alert severity={'warning'}>
            <Typography variant="body1">
              This will delete all the related data, including questions,
              collections, and evaluation.
            </Typography>
          </Alert>
        }
        onConfirm={() => {
          deleteGroup(deleteGroupId)
          setDeleteGroupId(null)
        }}
      />
    </Box>
  )
}

const getMyGroupsActions = (group, user, onLeave, onDelete) => {
  const actions = [
    <Button
      key="leave-group"
      startIcon={<LogoutIcon />}
      onClick={(ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        onLeave(group.id)
      }}
    >
      Leave this group
    </Button>,
  ]

  if (group.createdById === user.id) {
    actions.push(
      <Button
        key="delete-group"
        startIcon={
          <Image
            alt="Delete"
            src="/svg/icons/delete.svg"
            width="18"
            height="18"
          />
        }
        onClick={(ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          onDelete(group.id)
        }}
      >
        Delete this group
      </Button>,
    )
  }

  return actions
}

export default MyGroupsGrid
