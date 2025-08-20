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
import { Box, Tabs, Tab, Stack, Typography } from '@mui/material'

const ArchivingNavigation = ({ currentMode }) => {
  const router = useRouter()

  const tabs = [
    {
      mode: 'todo',
      label: 'To Do',
      path: '/admin/archiving',
      description: 'Needs attention',
    },
    {
      mode: 'pending',
      label: 'Pending',
      path: '/admin/archiving/pending',
      description: 'Scheduled',
    },
    {
      mode: 'done',
      label: 'Done',
      path: '/admin/archiving/done',
      description: 'Completed',
    },
  ]

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

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
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
  )
}

export default ArchivingNavigation
