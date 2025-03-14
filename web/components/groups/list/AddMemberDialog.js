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
import React, { useCallback, useState } from 'react'
import { IconButton, Stack, TextField } from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'

import { useSnackbar } from '@/context/SnackbarContext'
import DialogFeedback from '@/components/feedback/DialogFeedback'

import UserAvatar from '@/components/layout/UserAvatar'
import { Role } from '@prisma/client'

const AddMemberDialog = ({ group, open, onClose, onSuccess }) => {




  const { show: showSnackbar } = useSnackbar()

  const [search, setSearch] = useState('')

  const [members, setMembers] = useState([])
  const handleAddMember = useCallback(
    async (member) => {
      const response = await fetch(`/api/groups/${group.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member,
        }),
      })

      if (response.status === 200) {
        const group = await response.json()
        onSuccess(group)
      } else {
        const data = await response.json()
        showSnackbar(data.message, 'error')
      }
    },
    [group, onSuccess, showSnackbar],
  )

  const handleSearch = async (search) => {
    if (search.length < 2) {
      setMembers([])
      return
    }
    const response = await fetch(
      `/api/users?search=${search}&role=${Role.PROFESSOR}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    const data = await response.json()

    if (response.status === 200) {
      setMembers(data.users)
    } else {
      showSnackbar(data.message, 'error')
    }
  }

  console.log("members", members)

  return (
    group && (
      <DialogFeedback
        open={open}
        onClose={onClose}
        title={`Add a new member to ${group.label}`}
        content={
          <Stack spacing={2} mt={1}>
            <TextField
              label="Search for a professor"
              value={search}
              onChange={async (e) => {
                setSearch(e.target.value)
                await handleSearch(e.target.value)
              }}
              fullWidth
            />
            <Stack
              spacing={1}
              width={'400px'}
              maxHeight={'600px'}
              overflow={'auto'}
            >
              {members?.map((member) => (
                <Stack
                  key={member.id}
                  direction={'row'}
                  alignItems={'center'}
                  justifyContent={'space-between'}
                >
                  <UserAvatar key={member.id} user={member} />
                  <IconButton
                    onClick={async () => await handleAddMember(member)}
                  >
                    <PersonAddIcon />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </Stack>
        }
        onConfirm={() => {
          setSearch('')
          setMembers([])
        }}
      />
    )
  )
}

export default AddMemberDialog
