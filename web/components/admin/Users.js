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

import { Role } from '@prisma/client'
import { fetcher } from '@/code/utils'
import Loading from '../feedback/Loading'
import useSWR from 'swr'
import UserAvatar from '../layout/UserAvatar'
import DataGrid from '../ui/DataGrid'
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Chip,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material'
import { useCallback, useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { LoadingButton } from '@mui/lab'
import ScrollContainer from '../layout/ScrollContainer'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DialogFeedback from '../feedback/DialogFeedback'

const roleToDetails = {
  [Role.STUDENT]: {
    label: 'Student',
    color: 'info',
  },
  [Role.PROFESSOR]: {
    label: 'Professor',
    color: 'success',
  },
  [Role.SUPER_ADMIN]: {
    label: 'Super Admin',
    color: 'error',
  },
  [Role.ARCHIVIST]: {
    label: 'Archivist',
    color: 'warning',
  },
}

const Users = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const {
    data,
    error: errorUsers,
    mutate,
    isValidating,
  } = useSWR(
    `/api/users?search=${searchQuery}&page=${page}&pageSize=${pageSize}`,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  )

  const users = data?.users || []
  const pagination = data?.pagination || { total: 0, totalPages: 0 }

  const [search, setSearch] = useState('')

  const debouncedSearch = useDebouncedCallback((value) => {
    setSearchQuery(value)
    setPage(1) // Reset to first page when search changes
  }, 500)

  const [selected, setSelected] = useState(null)
  const [manageRolesDialogOpen, setManageRolesDialogOpen] = useState(false)

  const handlePageChange = (newPage) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page when page size changes
  }

  return (
    <Stack width="100%" height={'100%'} p={2} spacing={1}>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          label="Search"
          variant="outlined"
          value={search}
          fullWidth
          onChange={(ev) => {
            const value = ev.target.value
            setSearch(value)
            if (value.length >= 2) {
              debouncedSearch(value)
            } else {
              debouncedSearch('')
            }
          }}
          endAdornment={
            <LoadingButton loading={!data && !errorUsers}>
              loading
            </LoadingButton>
          }
        />
        <Box minWidth="70px">
          <Typography variant="h6">{pagination.total} users</Typography>
        </Box>
      </Stack>
      <Stack flex={1}>
        <Loading loading={isValidating} error={errorUsers}>
          <ScrollContainer>
            <Stack spacing={2} height="100%">
              <DataGrid
                header={{
                  actions: {
                    label: 'Actions',
                    width: '120px',
                  },
                  columns: [
                    {
                      label: 'User',
                      column: { minWidth: '220px', flexGrow: 1 },
                      renderCell: (row) => {
                        return <UserAvatar user={row} />
                      },
                    },
                    {
                      label: 'Roles',
                      column: { width: '280px' },
                      renderCell: (row) => {
                        return (
                          <Stack direction="row" spacing={1}>
                            {row.roles.map((role) => {
                              return (
                                <Chip
                                  key={role}
                                  label={roleToDetails[role].label}
                                  color={roleToDetails[role].color}
                                />
                              )
                            })}
                          </Stack>
                        )
                      },
                    },
                  ],
                }}
                items={users?.map((user) => ({
                  ...user,
                  meta: {
                    key: user.id,
                    actions: [
                      <Button
                        key="edit"
                        color="info"
                        onClick={() => {
                          setSelected(user)
                          setManageRolesDialogOpen(true)
                        }}
                      >
                        Manage roles
                      </Button>,
                    ],
                  },
                }))}
              />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 3,
                  pt: 2,
                  borderColor: 'divider',
                }}
              >
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value={10}>10 Rows</MenuItem>
                    <MenuItem value={25}>25 Rows</MenuItem>
                    <MenuItem value={50}>50 Rows</MenuItem>
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      size="small"
                    >
                      <ChevronLeftIcon />
                    </IconButton>
                    <Typography variant="body2">Page {page}</Typography>
                    <IconButton
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= pagination.totalPages}
                      size="small"
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </ScrollContainer>
        </Loading>
      </Stack>
      <ManageRolesDialog
        open={manageRolesDialogOpen}
        user={selected}
        onClose={() => {
          setManageRolesDialogOpen(false)
          setSelected(null)
        }}
        onChange={(updatedUser) => {
          mutate(
            {
              ...data,
              users: users.map((user) =>
                user.id === updatedUser.id ? updatedUser : user,
              ),
            },
            false,
          )
        }}
      />
    </Stack>
  )
}

const ManageRolesDialog = ({ open, user, onClose, onChange }) => {
  const [roles, setRoles] = useState(user?.roles)

  useEffect(() => {
    setRoles(user?.roles)
  }, [user])

  const save = useCallback(async () => {
    await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ roles }),
    })
      .then((res) => res.json())
      .then((updatedUser) => {
        onChange(updatedUser)
        return updatedUser
      })

    onClose()
  }, [user, roles, onClose, onChange])

  return (
    <DialogFeedback
      open={open}
      onClose={() => onClose()}
      onConfirm={() => save()}
      title="Manage roles"
      content={
        roles && (
          <Stack>
            <Typography variant="body2">
              Select the roles for this user
            </Typography>
            <Stack direction="row" spacing={1}>
              <FormGroup>
                {Object.keys(Role).map((role) => {
                  return (
                    <FormControlLabel
                      key={role}
                      control={
                        <Checkbox
                          checked={roles.includes(role)}
                          onChange={(ev) => {
                            if (ev.target.checked) {
                              setRoles([...roles, role])
                            } else {
                              setRoles(roles.filter((r) => r !== role))
                            }
                          }}
                        />
                      }
                      label={role}
                    />
                  )
                })}
              </FormGroup>
            </Stack>
          </Stack>
        )
      }
    />
  )
}

export default Users
