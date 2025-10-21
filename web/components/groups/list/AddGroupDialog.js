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
import { Stack } from '@mui/material'

import { useGroup } from '@/context/GroupContext'
import { useSnackbar } from '@/context/SnackbarContext'

import DialogFeedback from '@/components/feedback/DialogFeedback'
import GroupScopeInput from '@/components/input/GroupScopeInput '

const AddGroupDialog = ({ open, selectOnCreate, onClose, onSuccess }) => {
  const { mutate: mutateGroups } = useGroup()
  const { showAt: showSnackbarAt } = useSnackbar()

  const [label, setLabel] = useState('')
  const [scope, setScope] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGroupScopeChange = (newLabel, newScope) => {
    setLabel(newLabel)
    setScope(newScope)
  }

  const handleAddGroup = useCallback(async () => {
    setIsSubmitting(true)
    const response = await fetch(`/api/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        label,
        scope,
        select: selectOnCreate,
      }),
    })
    const data = await response.json()
    setIsSubmitting(false)

    if (response.status === 200) {
      mutateGroups && mutateGroups()
      onSuccess && onSuccess(data)
    } else {
      showSnackbarAt(
        { vertical: 'bottom', horizontal: 'center' },
        data.message,
        'error',
      )
    }
  }, [label, scope, selectOnCreate, showSnackbarAt, mutateGroups, onSuccess])

  return (
    <DialogFeedback
      open={open}
      onClose={onClose}
      title="Create a new group"
      content={
        <Stack spacing={2} mt={1} minWidth={300}>
          <GroupScopeInput
            label={label}
            scope={scope}
            onChange={handleGroupScopeChange}
          />
        </Stack>
      }
      onConfirm={handleAddGroup}
      confirmButtonProps={{
        disabled: isSubmitting || !label || !scope,
      }}
    />
  )
}

export default AddGroupDialog
