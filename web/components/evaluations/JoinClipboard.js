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

import { Paper, Stack, Typography, ListItemButton } from '@mui/material'
import { getStudentEntryLink } from '@/core/utils'

const JoinClipboard = ({ evaluationId, desktopAppRequired = false }) => {
  const link = getStudentEntryLink(evaluationId, desktopAppRequired)

  const onClick = async () => {
    await navigator.clipboard.writeText(link)
  }

  return (
    <Paper variant="outlined">
      <ListItemButton onClick={onClick} style={{ cursor: 'pointer' }}>
        <Stack direction="row" spacing={2} alignItems="center" flex={1}>
          <Stack flex={1}>
            <Typography variant="caption" size="small">
              {link}
            </Typography>
          </Stack>
          <Typography variant="button" color="secondary">
            Copy
          </Typography>
        </Stack>
      </ListItemButton>
    </Paper>
  )
}

export default JoinClipboard
