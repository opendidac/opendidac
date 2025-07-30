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
import { Menu, Button, Stack } from '@mui/material'
import LockClosedIcon from '@mui/icons-material/Lock'
import GroupIcon from '@mui/icons-material/Group'
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { Role } from '@prisma/client'

const UserContextMenu = ({ anchorElUser, handleCloseUserMenu }) => {
  const { data: session } = useSession()
  return (
    <Menu
      sx={{ mt: '40px' }}
      id="menu-appbar"
      anchorEl={anchorElUser}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={Boolean(anchorElUser)}
      onClose={handleCloseUserMenu}
    >
      <Stack padding={2} spacing={2} alignItems={'flex-start'}>
        {session.user.roles.includes(Role.SUPER_ADMIN) && (
          <Link href={`/admin`}>
            <Button startIcon={<SupervisedUserCircleIcon />}>
              Admin Panel
            </Button>
          </Link>
        )}

        <Link href={`/groups`}>
          <Button startIcon={<GroupIcon />}>Manage Groups</Button>
        </Link>
        <Button onClick={() => signOut()} startIcon={<LockClosedIcon />}>
          Sign Out
        </Button>
      </Stack>
    </Menu>
  )
}

export default UserContextMenu
