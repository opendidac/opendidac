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
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Users from './Users'
import Groups from './Groups'
import Archiving from './Archiving'
import Statistics from './Statistics'

// Constants for tab configuration
const ADMIN_TABS = [
  { key: 'users', label: 'Users', component: Users, route: '/admin/users' },
  { key: 'groups', label: 'Groups', component: Groups, route: '/admin/groups' },
  {
    key: 'archiving',
    label: 'Archiving',
    component: Archiving,
    route: '/admin/archiving',
  },
  {
    key: 'statistics',
    label: 'Statistics',
    component: Statistics,
    route: '/admin/statistics',
  },
]

// User role utilities - simplified to work directly with session
const getRolePermissions = (session) => {
  if (!session?.user?.roles) {
    return {
      allowedRoles: [],
      availableTabs: [],
      showMaintenance: false,
      defaultRedirect: '/',
      isSuperAdmin: false,
      isArchivist: false,
    }
  }

  const roles = session.user.roles
  const isSuperAdmin = roles.includes(Role.SUPER_ADMIN)
  const isArchivist = roles.includes(Role.ARCHIVIST)

  if (isSuperAdmin) {
    return {
      allowedRoles: [Role.SUPER_ADMIN],
      availableTabs: ADMIN_TABS,
      showMaintenance: true,
      defaultRedirect: '/admin/users',
      isSuperAdmin: true,
      isArchivist: false,
    }
  }

  if (isArchivist) {
    return {
      allowedRoles: [Role.ARCHIVIST, Role.SUPER_ADMIN],
      availableTabs: ADMIN_TABS.filter((tab) => tab.key === 'archiving'),
      showMaintenance: false,
      defaultRedirect: '/admin/archiving',
      isSuperAdmin: false,
      isArchivist: true,
    }
  }

  return {
    allowedRoles: [],
    availableTabs: [],
    showMaintenance: false,
    defaultRedirect: '/',
    isSuperAdmin: false,
    isArchivist: false,
  }
}

// Maintenance Panel Component
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

// Tab Navigation Component
const AdminTabNavigation = ({
  availableTabs,
  currentTabIndex,
  onTabChange,
}) => {
  if (availableTabs.length <= 1) {
    return null // Don't show tabs if there's only one or no tabs
  }

  return (
    <Tabs
      value={currentTabIndex}
      onChange={onTabChange}
      aria-label="admin tabs"
    >
      {availableTabs.map((tab) => (
        <Tab key={tab.key} label={tab.label} sx={{ opacity: 1, m: 1 }} />
      ))}
    </Tabs>
  )
}

// Admin Header Component
const AdminHeader = ({
  session,
  availableTabs,
  currentTabIndex,
  onTabChange,
}) => {
  const permissions = getRolePermissions(session)

  const getHeaderTitle = () => {
    if (permissions.isArchivist) {
      return 'Archiving Management'
    }
    return null // For super admin, show tabs instead of title
  }

  const headerTitle = getHeaderTitle()

  return (
    <Stack direction={'row'}>
      <Stack direction={'row'} spacing={1} alignItems={'center'} flex={1}>
        {permissions.isSuperAdmin && <BackButton backUrl="/" />}
        {headerTitle ? (
          <Typography variant="h6" sx={{ opacity: 1, m: 1 }}>
            {headerTitle}
          </Typography>
        ) : (
          <AdminTabNavigation
            availableTabs={availableTabs}
            currentTabIndex={currentTabIndex}
            onTabChange={onTabChange}
          />
        )}
      </Stack>
      {permissions.showMaintenance && <MaintenancePanel />}
    </Stack>
  )
}

// Main Admin Layout Component
const AdminLayout = ({
  children,
  session,
  availableTabs,
  currentTabIndex,
  onTabChange,
}) => {
  const permissions = getRolePermissions(session)

  return (
    <Authorization allowRoles={permissions.allowedRoles}>
      <LayoutMain
        hideLogo
        header={
          <AdminHeader
            session={session}
            availableTabs={availableTabs}
            currentTabIndex={currentTabIndex}
            onTabChange={onTabChange}
          />
        }
      >
        <Box sx={{ width: '100%', height: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}></Box>
          <Box sx={{ height: 'calc(100% - 2px)' }}>{children}</Box>
        </Box>
      </LayoutMain>
    </Authorization>
  )
}

// Tab Content Router
const TabContentRouter = ({ availableTabs, currentPath }) => {
  // Determine archiving mode based on the specific route
  if (currentPath.startsWith('/admin/archiving')) {
    if (currentPath === '/admin/archiving/pending') {
      return <Archiving mode="pending" />
    }
    if (currentPath === '/admin/archiving/done') {
      return <Archiving mode="done" />
    }
    return <Archiving mode="todo" />
  }

  // Find the matching tab based on current path
  const activeTab = availableTabs.find(
    (tab) =>
      currentPath.startsWith(tab.route) ||
      (tab.key === 'users' && currentPath === '/admin'),
  )

  if (activeTab) {
    const Component = activeTab.component
    return <Component />
  }

  // Default fallback
  const defaultTab = availableTabs[0]
  if (defaultTab) {
    const Component = defaultTab.component
    return <Component />
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="body1" color="text.secondary">
        No content available
      </Typography>
    </Box>
  )
}

// Main Page Component
const PageAdmin = ({ activeTab = 'users' }) => {
  const router = useRouter()
  const { data: session } = useSession()

  // Determine user role and permissions
  const permissions = getRolePermissions(session)
  const { availableTabs } = permissions

  // Tab navigation logic
  const getCurrentTabIndex = () => {
    const currentPath = router.asPath
    return availableTabs.findIndex(
      (tab) =>
        currentPath.startsWith(tab.route) ||
        (tab.key === 'users' && currentPath === '/admin'),
    )
  }

  const handleTabChange = (event, newValue) => {
    const targetTab = availableTabs[newValue]
    if (targetTab) {
      router.push(targetTab.route)
    }
  }

  const currentTabIndex = getCurrentTabIndex()

  // Render the appropriate layout
  return (
    <AdminLayout
      session={session}
      availableTabs={availableTabs}
      currentTabIndex={currentTabIndex}
      onTabChange={handleTabChange}
    >
      <TabContentRouter
        availableTabs={availableTabs}
        currentPath={router.asPath}
      />
    </AdminLayout>
  )
}

export default PageAdmin
