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
import { useState } from 'react'

import { AppBar, Box, Stack } from '@mui/material'
import { useSession } from 'next-auth/react'

import UserAvatar from './UserAvatar'
import UserContextMenu from './UserContextMenu'
import Logo from './Logo'
import { useTheme } from '@emotion/react'

const Header = ({ hideLogo, children, color }) => {
  const theme = useTheme()
  const { data: session } = useSession()
  const [anchorElUser, setAnchorElUser] = useState(null)
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget)
  const handleCloseUserMenu = () => setAnchorElUser(null)
  return (
    <AppBar
      position="static"
      enableColorOnDark
      color={color}
      sx={{
        height: '60px',
        maxWidth: '100vw',
        p: 0,
        position: 'relative',
        zIndex: 1000,
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: 0,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        pl={1}
        pr={1}
        spacing={1}
        height="100%"
      >
        {!hideLogo && (
          <Box sx={{ mt: 1, ml: 1, mr: 0.5 }}>
            <Logo color="red" />
          </Box>
        )}

        <Stack flex={1} sx={{ overflow: 'hidden' }}>
          {children}
        </Stack>

        <UserAvatar user={session.user} onCLick={handleOpenUserMenu} />
        <UserContextMenu
          anchorElUser={anchorElUser}
          handleCloseUserMenu={handleCloseUserMenu}
        />
      </Stack>
    </AppBar>
  )
}

export default Header
