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

import { Box, Card, CardContent, Typography, Button } from '@mui/material'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'

const StatCard = ({
  title,
  value,
  subtitle,
  color = 'primary',
  helpContent,
  onView,
  showViewButton = false,
}) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography color="textPrimary" gutterBottom variant="h6">
          {title}
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          {showViewButton && onView && (
            <Button size="small" variant="text" onClick={onView} sx={{ ml: 1 }}>
              View
            </Button>
          )}
          {helpContent && (
            <UserHelpPopper mode="info" size="small">
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {helpContent}
              </Typography>
            </UserHelpPopper>
          )}
        </Box>
      </Box>
      <Typography variant="h4" component="div" color="textPrimary">
        {value}
      </Typography>
      {subtitle && (
        <Typography color="textPrimary" variant="body2">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
)

export default StatCard
