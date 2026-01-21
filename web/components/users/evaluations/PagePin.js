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

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Box, Button, Container, Stack, Typography, Alert } from '@mui/material'
import PinInput from '@/components/input/PinInput'

const PagePin = () => {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!pin || pin.trim().length !== 6) {
      setError('PIN must be 6 characters')
      setLoading(false)
      return
    }

    if (status !== 'authenticated' || !session) {
      setError('You must be logged in to join an evaluation')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users/evaluations/join-by-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ pin: pin.toUpperCase().trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Invalid PIN')
        setLoading(false)
        return
      }

      // Redirect to the evaluation page
      router.push(`/users/evaluations/${data.evaluationId}`)
    } catch (err) {
      setError('Error connecting to server. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Stack spacing={3} sx={{ width: '100%', maxWidth: 400 }}>
          <Typography variant="body1" align="center" color="text.secondary">
            Enter the 6-character PIN provided by your professor
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3} alignItems="center">
              <Box sx={{ width: '100%' }}>
                <PinInput
                  value={pin}
                  onChange={(newPin) => {
                    setPin(newPin)
                    setError('')
                  }}
                  error={!!error}
                  disabled={loading}
                  autoFocus
                />
                {error && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ display: 'block', mt: 1, textAlign: 'center' }}
                  >
                    {error}
                  </Typography>
                )}
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={loading || pin.length !== 6}
              >
                {loading ? 'Joining...' : 'Join Evaluation'}
              </Button>
            </Stack>
          </form>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
        </Stack>
      </Box>
    </Container>
  )
}

export default PagePin
