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
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useSession } from 'next-auth/react'
import DialogFeedback from '@/components/feedback/DialogFeedback'
import { useCallback, useEffect, useState } from 'react'
import { useSnackbar } from '@/context/SnackbarContext'

import DataGrid from '@/components/ui/DataGrid'
import UserAvatar from '@/components/layout/UserAvatar'
import AlertFeedback from '@/components/feedback/AlertFeedback'

import GroupScopeInput from '@/components/input/GroupScopeInput '
import { LoadingButton } from '@mui/lab'

const GroupMembersGrid = ({ group, onUpdate, onSelfRemoved }) => {
  const { show: showSnackbar } = useSnackbar()
  const { data: session } = useSession()

  const [label, setLabel] = useState(group.label)
  const [scope, setScope] = useState(group.scope)

  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [removeTargetId, setRemoveTargetId] = useState(null)
  const handleRemoveMember = useCallback(
    async (userId) => {
      try {
        const response = await fetch(`/api/groups/${group.id}/members`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        })
        if (!response.ok) {
          const data = await response.json()
          showSnackbar(data.message || 'Failed to remove member', 'error')
          return
        }
        showSnackbar('Member removed', 'success')
        // Refresh group members and groups list
        onUpdate && (await onUpdate(scope))
        // If current user removed themselves, notify parent
        if (session?.user?.id === userId) {
          onSelfRemoved && (await onSelfRemoved(group.id))
        }
      } catch (e) {
        showSnackbar('Failed to remove member', 'error')
      }
    },
    [group.id, onUpdate, onSelfRemoved, scope, session?.user?.id, showSnackbar],
  )

  useEffect(() => {
    setLabel(group.label)
    setScope(group.scope)
  }, [group.id, group.label, group.scope])

  const handleSaveGroup = useCallback(
    async (label, scope) => {
      setLoading(true)
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label,
          scope,
        }),
      })

      if (response.status === 200) {
        showSnackbar('Group saved', 'success')
        onUpdate && onUpdate(scope)
      } else {
        const data = await response.json()
        showSnackbar(data.message, 'error')
      }
      setLoading(false)
    },
    [group, onUpdate, showSnackbar],
  )

  return (
    <>
      <Box minWidth={'100%'} pl={2} pr={2} pt={1}>
        <Stack
          direction="row"
          alignItems="flex-start"
          spacing={2}
          width={'100%'}
        >
          <GroupScopeInput
            groupId={group.id}
            label={label}
            scope={scope}
            onChange={async (newLabel, newScope, available) => {
              if (!available) return
              setLabel(newLabel)
              setScope(newScope)
            }}
          />
          {group && group.label !== label && (
            <LoadingButton
              variant="contained"
              onClick={() => handleSaveGroup(label, scope)}
              loading={loading}
            >
              Save
            </LoadingButton>
          )}
        </Stack>

        {group && group.members && group.members.length > 0 && (
          <DataGrid
            header={{
              columns: [
                {
                  label: 'Member',
                  column: { flexGrow: 1 },
                  renderCell: (row) => <UserAvatar user={row.user} />,
                },
              ],
              actions: { label: 'Actions', width: 120 },
            }}
            items={group.members.map((member) => ({
              ...member,
              meta: {
                key: member.userId,
                actions: [
                  <Tooltip
                    key={`remove-${member.userId}`}
                    title={
                      group.createdById === member.userId
                        ? 'The creator cannot be removed'
                        : 'Remove from group'
                    }
                  >
                    <IconButton
                      size="small"
                      disabled={group.createdById === member.userId}
                      onClick={async (ev) => {
                        ev.preventDefault()
                        ev.stopPropagation()
                        if (session?.user?.id === member.userId) {
                          setRemoveTargetId(member.userId)
                          setConfirmOpen(true)
                          return
                        }
                        await handleRemoveMember(member.userId)
                      }}
                      aria-label={`Remove ${member.user?.name || member.user?.email} from group`}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>,
                ],
              },
            }))}
          />
        )}
        {group && group.members && group.members.length === 0 && (
          <AlertFeedback severity="info">
            <Typography variant="body1">
              There are no members in this group.
            </Typography>
          </AlertFeedback>
        )}
      </Box>
      {confirmOpen && (
        <DialogFeedback
          open={confirmOpen}
          title={`Leave group ${group.label}?`}
          content={
            <Typography variant="body2">
              You are about to remove yourself from this group. You will no
              longer have access to its content.
            </Typography>
          }
          onClose={() => {
            setConfirmOpen(false)
            setRemoveTargetId(null)
          }}
          onConfirm={async () => {
            const target = removeTargetId
            setConfirmOpen(false)
            setRemoveTargetId(null)
            if (target) {
              await handleRemoveMember(target)
            }
          }}
        />
      )}
    </>
  )
}

export default GroupMembersGrid
