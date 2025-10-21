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

import { Box, Card, CardContent, Typography, Stack, Chip } from '@mui/material'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'

const ExcludedGroupsDisplay = ({ groups }) => {
  if (!groups || groups.length === 0) {
    return null
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" gutterBottom>
            Excluded Groups
          </Typography>
          <UserHelpPopper mode="info" size="small">
            <Box>
              <Typography variant="body2" paragraph>
                Shows groups that were automatically excluded from statistics
                because they are identified as test groups. Test groups are
                identified by exact scope matches with predefined patterns:
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2">
                  &apos;test-2023&apos;, &apos;test-jfavlam&apos;,
                  &apos;demo&apos;, &apos;test&apos;, &apos;test-import&apos;,
                  &apos;demo-2025&apos;
                </Typography>
              </Typography>
              <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                These groups are filtered out to ensure statistics reflect only
                real educational usage and not testing/development activities.
              </Typography>
            </Box>
          </UserHelpPopper>
        </Box>
        <Typography variant="body2" color="textSecondary" paragraph>
          The following groups were excluded from statistics as they appear to
          be test groups:
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {groups.map((group) => (
            <Chip key={group} label={group} size="small" color="warning" />
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default ExcludedGroupsDisplay
