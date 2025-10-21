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
import {
  Stack,
  IconButton,
  Avatar,
  ListItemText,
  Typography,
  Collapse,
} from '@mui/material'
const UserAvatar = ({ user, collapsed, onCLick }) => {
  return (
    <Stack direction="row" onClick={onCLick} sx={{ cursor: 'pointer' }}>
      <IconButton sx={{ p: 1 }}>
        <Avatar
          alt={user.name}
          src={user.image}
          sx={{ width: 32, height: 32 }}
        />
      </IconButton>
      <Collapse orientation="horizontal" in={!collapsed}>
        <ListItemText
          primary={<Typography variant="body2">{user.name}</Typography>}
          secondary={<Typography variant="caption">{user.email}</Typography>}
        />
      </Collapse>
    </Stack>
  )
}

export default UserAvatar
