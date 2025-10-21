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
import { useRouter } from 'next/router'
import { Box, Tabs, Tab, Stack, Typography, Alert } from '@mui/material'
import { Sort } from '@mui/icons-material'

const ArchivingNavigation = ({ currentMode }) => {
  const router = useRouter()

  const tabs = [
    {
      mode: 'todo',
      label: 'To Do',
      path: '/admin/archiving',
      description: 'Active & overdue archival',
    },
    {
      mode: 'pending',
      label: 'Pending',
      path: '/admin/archiving/pending',
      description: 'Marked for archival',
    },
    {
      mode: 'done',
      label: 'Done',
      path: '/admin/archiving/done',
      description: 'Purged evaluations',
    },
  ]

  // Sorting information for each mode
  const getSortingInfo = (mode) => {
    switch (mode) {
      case 'todo':
        return {
          text: 'Sorted by creation date (oldest first)',
          detail:
            'Prioritizing evaluations waiting longest for archival action',
          severity: 'info',
        }
      case 'pending':
        return {
          text: 'Sorted by archival deadline (earliest first)',
          detail: 'Prioritizing upcoming deadlines to prevent breaches',
          severity: 'warning',
        }
      case 'done':
        return {
          text: 'Sorted by completion date (most recent first)',
          detail: 'Showing latest archival activity',
          severity: 'success',
        }
      default:
        return {
          text: 'Default sorting applied',
          detail: '',
          severity: 'info',
        }
    }
  }

  const getCurrentTabIndex = () => {
    const currentPath = router.asPath

    // If on root archiving path, default to todo (index 0)
    if (currentPath === '/admin/archiving') {
      return 0
    }

    return tabs.findIndex((tab) => tab.mode === currentMode)
  }

  const handleTabChange = (event, newValue) => {
    const selectedTab = tabs[newValue]
    if (selectedTab) {
      router.push(selectedTab.path)
    }
  }

  const sortInfo = getSortingInfo(currentMode)

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        {/* Tabs on the left */}
        <Box flex={1}>
          <Tabs
            value={getCurrentTabIndex()}
            onChange={handleTabChange}
            aria-label="archiving navigation tabs"
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.mode}
                label={
                  <Stack direction="column" alignItems="flex-start" spacing={0}>
                    <Typography variant="body2" fontWeight="medium">
                      {tab.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tab.description}
                    </Typography>
                  </Stack>
                }
                sx={{
                  minHeight: 64,
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  opacity: 1,
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Sorting info on the right */}

        <Alert
          severity={sortInfo.severity}
          icon={<Sort fontSize="small" />}
          sx={{
            py: 0.5,
            '& .MuiAlert-message': {
              py: 0.5,
            },
          }}
        >
          <Stack spacing={0.25}>
            <Typography variant="body1" fontWeight="medium">
              {sortInfo.text}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sortInfo.detail}
            </Typography>
          </Stack>
        </Alert>
      </Stack>
    </Box>
  )
}

export default ArchivingNavigation
