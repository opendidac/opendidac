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
import {
  Alert,
  Box,
  Stack,
  Typography,
  Tabs,
  Tab,
  Button,
  Menu,
} from '@mui/material'
import LayoutMain from '../layout/LayoutMain'
import BackButton from '../layout/BackButton'
import { useCallback, useState } from 'react'
import DialogFeedback from '../feedback/DialogFeedback'
import { LoadingButton } from '@mui/lab'
import { useSnackbar } from '@/context/SnackbarContext'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import Users from './Users'
import Groups from './Groups'
import Archiving from './Archiving'

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
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  return (
    <Authorization allowRoles={[Role.SUPER_ADMIN]}>
      <LayoutMain
        hideLogo
        header={
          <Stack direction={'row'}>
            <Stack direction={'row'} spacing={1} alignItems={'center'} flex={1}>
              <BackButton backUrl="/" />
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="admin tabs"
              >
                <Tab label="Users" sx={{ opacity: 1, m: 1 }} />
                <Tab label="Groups" sx={{ opacity: 1, m: 1 }} />
                <Tab label="Archiving" sx={{ opacity: 1, m: 1 }} />
              </Tabs>
            </Stack>
            <MaintenancePanel />
          </Stack>
        }
      >
        <Box sx={{ width: '100%', height: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}></Box>
          <Box sx={{ height: 'calc(100% - 2px)' }}>
            {tabValue === 0 && <Users />}
            {tabValue === 1 && <Groups />}
            {tabValue === 2 && <Archiving />}
          </Box>
        </Box>
      </LayoutMain>
    </Authorization>
  )
}

export default PageAdmin
