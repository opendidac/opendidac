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
import LockPersonIcon from '@mui/icons-material/LockPerson'
import { signIn } from 'next-auth/react'
import { Box, Button, Typography } from '@mui/material'
import Link from 'next/link'

const LoginScreen = ({ message }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {message && (
        <Typography variant="body1" color="error" sx={{ mb: 2 }}>
          {message}
        </Typography>
      )}
      <Button
        variant="contained"
        onClick={() => signIn('github')}
        startIcon={<LockPersonIcon />}
      >
        Sign In
      </Button>
      <Typography
        variant="caption"
        color="textSecondary"
        sx={{ mt: 2, maxWidth: '400px', textAlign: 'center' }}
      >
        By signing in, you agree to our{' '}
        <Link href="/terms" passHref legacyBehavior>
          Terms of Service and Privacy Policy
        </Link>.
      </Typography>
    </Box>
  )
}

export default LoginScreen
