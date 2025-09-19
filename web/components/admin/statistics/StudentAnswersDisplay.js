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
import { Box, Typography, Stack } from '@mui/material'

const StudentAnswersDisplay = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Typography color="textSecondary">
        No data available for the selected academic year
      </Typography>
    )
  }

  return (
    <Stack spacing={1}>
      {Object.entries(data).map(([type, count]) => (
        <Box
          key={type}
          sx={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <Typography variant="body1">
            {type.charAt(0).toUpperCase() +
              type.slice(1).replace(/([A-Z])/g, ' $1')}
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {count}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

export default StudentAnswersDisplay
