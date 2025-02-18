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
import Authorization from '../security/Authorization'
import { fetcher } from '@/code/utils'
import Loading from '../feedback/Loading'
import useSWR from 'swr'
import UserAvatar from '../layout/UserAvatar'
import DataGrid from '../ui/DataGrid'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  Menu,
  Stack,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  IconButton,
} from '@mui/material'
import LayoutMain from '../layout/LayoutMain'
import BackButton from '../layout/BackButton'
import { useCallback, useEffect, useState } from 'react'
import DialogFeedback from '../feedback/DialogFeedback'
import { useDebouncedCallback } from 'use-debounce'
import { LoadingButton } from '@mui/lab'

import ScrollContainer from '../layout/ScrollContainer'
import { useSnackbar } from '@/context/SnackbarContext'

import MoreVertIcon from '@mui/icons-material/MoreVert'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

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
}

const MaintenancePanel = () => {
  const [anchorElUser, setAnchorEl] = useState(null)

  const { showTopCenter: showSnackbar } = useSnackbar()

  const [openRunAllSandboxesDialog, setOpenRunAllSandboxesDialog] =
    useState(false)

  const [openUnusedUploadsCleanupDialog, setOpenUnusedUploadsCleanupDialog] =
    useState(false)

  const [runningAllSandbox, setRunningAllSandbox] = useState(false)
  const [runningUploadsCleanup, setRunningUploadsCleanup] = useState(false)

  const runAllSandboxesAndUpdateExpectedOutput = useCallback(async () => {
    setRunningAllSandbox(true)
    await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'run_all_sandboxes_and_update_expected_output',
      }),
    })
    setRunningAllSandbox(false)
    showSnackbar(
      'All sandboxes have been run and expected outputs updated',
      'success',
    )
  }, [showSnackbar])

  const cleanupUnusedUploads = useCallback(async () => {
    setRunningUploadsCleanup(true)
    const response = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cleanup_unused_uploads',
        options: {
          domaine: window.location.origin,
        },
      }),
    }).then((res) => res.json())
    setRunningUploadsCleanup(false)

    showSnackbar(
      `Cleanup successful: ${response.deleted} files deleted`,
      'success',
    )
  }, [showSnackbar])

  return (
    <Stack direction="row" spacing={1}>
      <Button
        size="small"
        onClick={(ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          setAnchorEl(ev.currentTarget)
        }}
        endIcon={<MoreVertIcon />}
      >
        Maintenance
      </Button>
      <Menu
        sx={{ mt: '40px' }}
        id="menu-maintenance"
        anchorEl={anchorElUser}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        keepMounted
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={Boolean(anchorElUser)}
        onClose={() => setAnchorEl(null)}
      >
        <Stack padding={2} spacing={2} alignItems={'flex-start'}>
          <LoadingButton
            color="info"
            onClick={() => setOpenRunAllSandboxesDialog(true)}
            loading={runningAllSandbox}
            fullWidth
          >
            Run all sandboxes and update expected outputs
          </LoadingButton>
          <LoadingButton
            color="info"
            onClick={() => setOpenUnusedUploadsCleanupDialog(true)}
            loading={runningUploadsCleanup}
            fullWidth
          >
            Cleanup unused uploads
          </LoadingButton>
        </Stack>
      </Menu>

      <DialogFeedback
        open={openRunAllSandboxesDialog}
        onClose={() => setOpenRunAllSandboxesDialog(false)}
        onConfirm={() => runAllSandboxesAndUpdateExpectedOutput()}
        title="Run all sandboxes and update expected output"
        content={
          <Stack spacing={2}>
            <Typography variant="body1">
              This action will run all code writing question sandboxes and
              update the related text cases with the expected output.
            </Typography>
            <Typography variant="body2">
              This will also update the expected outputs for the code writing
              questions that are part of evaluations.
            </Typography>

            <Typography variant="body2">
              Are you sure you want to run all sandboxes and update the expected
              output of the test cases?
            </Typography>
            <Alert severity="warning">
              This action may be resource intensive and may take time to
              complete (up to 10 mins in dev environement with 450 code writing
              questions). It will run 1 sandbox at a time. You cannot cancel it
              once started.
            </Alert>
          </Stack>
        }
      />
      <DialogFeedback
        open={openUnusedUploadsCleanupDialog}
        onClose={() => setOpenUnusedUploadsCleanupDialog(false)}
        onConfirm={() => cleanupUnusedUploads()}
        title="Cleanup unused uploads"
        content={
          <Stack spacing={2}>
            <Typography variant="body1">
              This action will cleanup all unused uploads.
            </Typography>
            <Typography variant="body2">
              Are you sure you want to cleanup all unused uploads?
            </Typography>
          </Stack>
        }
      />
    </Stack>
  )
}

const PageAdmin = () => {
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
    <Authorization allowRoles={[Role.SUPER_ADMIN]}>
      <LayoutMain
        hideLogo
        header={
          <Stack
            direction="row"
            alignItems={'center'}
            justifyContent={'space-between'}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <BackButton backUrl="/" />
              <Typography variant="h6">Role Management</Typography>
            </Stack>
            <MaintenancePanel />
          </Stack>
        }
      >
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
          <Loading loading={isValidating} error={errorUsers}>
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
      </LayoutMain>
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
    </Authorization>
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

export default PageAdmin
