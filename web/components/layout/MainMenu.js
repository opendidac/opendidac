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
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Tabs, Tab, Box, Stack } from '@mui/material'
import GroupSelector from './GroupSelector'
const MainMenu = () => {
  const { query, asPath } = useRouter()
  const { groupScope } = query

  return (
    <Stack direction={'row'} spacing={1} alignItems={'center'}>
      <Box>
        <GroupSelector />
      </Box>
      <Tabs
        variant="scrollable"
        value={asPath.split('/')[2] || 'questions'}
        aria-label="main-menu"
        indicatorColor="secondary"
      >
        {mainPaths.map((path) => (
          <Link
            key={path.path}
            value={path.path}
            href={`/${groupScope}/${path.path}`}
            passHref
          >
            <Tab
              value={path.path}
              label={path.label}
              sx={{ opacity: 1, m: 1 }}
            />
          </Link>
        ))}
      </Tabs>
    </Stack>
  )
}

const mainPaths = [
  {
    path: 'questions',
    label: 'Questions',
  },
  {
    path: 'evaluations',
    label: 'Evaluations',
  },
]

export default MainMenu
