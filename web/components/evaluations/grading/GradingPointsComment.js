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
import { Chip, Stack, TextField, Typography } from '@mui/material'
const GradingPointsComment = ({ points, maxPoints, comment }) => {
  let color = points > 0 ? 'success' : 'error'
  return (
    <Stack direction="row" alignItems="center" spacing={1} flex={1}>
      <Chip
        variant="outlined"
        color={color}
        label={
          <>
            <Typography variant="body2" component="span" sx={{ mr: 1 }}>
              <b>{points}</b>
            </Typography>
            <Typography variant="caption" component="span">
              / {maxPoints} pts
            </Typography>
          </>
        }
      />
      <TextField
        label="Comment"
        fullWidth
        multiline
        maxRows={3}
        size={'small'}
        value={comment || ''}
        InputProps={{
          readOnly: true,
        }}
      />
    </Stack>
  )
}

export default GradingPointsComment
