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
import { useSession } from 'next-auth/react'
import { Box, Chip, Typography } from '@mui/material'

import DataGrid from '@/components/ui/DataGrid'
import AlertFeedback from '@/components/feedback/AlertFeedback'

const MyGroupsGrid = ({ groups, selectedGroup, onSelected }) => {
  const { data: session } = useSession()

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
            },
          }))}
          rowStyle={(item) => ({
            backgroundColor:
              selectedGroup?.id === item.id ? 'action.selected' : 'transparent',
            '&:hover': {
              backgroundColor:
                selectedGroup?.id === item.id
                  ? 'action.selected'
                  : 'action.hover',
            },
          })}
        />
      )}
      {groups && groups.length === 0 && (
        <AlertFeedback severity="info">
          <Typography variant="body1">
            You are not a member of any groups.
          </Typography>
        </AlertFeedback>
      )}
    </Box>
  )
}

export default MyGroupsGrid
