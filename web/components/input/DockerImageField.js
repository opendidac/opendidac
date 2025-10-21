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
import { useSnackbar } from '@/context/SnackbarContext'
import { Box, IconButton, TextField, Tooltip } from '@mui/material'
import { useState } from 'react'
import StatusDisplay from '../feedback/StatusDisplay'

const DockerImageField = ({ image, onChange }) => {
  const [pullStatus, setPullStatus] = useState('RELOAD')
  const { show: showSnackbar } = useSnackbar()

  const pullImage = async (image) => {
    setPullStatus('LOADING')
    await fetch(`/api/sandbox/image/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        image: image,
      }),
    })
      .then((data) => data.json())
      .then((data) => {
        setPullStatus(data.status)
        const severity = data.status === 'SUCCESS' ? 'success' : 'error'
        showSnackbar(data.message, severity)
        // Set to RELOAD after 2 seconds
        setTimeout(() => {
          setPullStatus('RELOAD')
        }, 2000)
      })
  }

  return (
    <TextField
      id="image"
      label="Docker Image"
      variant="standard"
      value={image}
      fullWidth
      onChange={(ev) => {
        onChange(ev.target.value)
      }}
      InputProps={{
        endAdornment: (
          <Tooltip title="Pull the latest version">
            <Box ml={0.5}>
              <IconButton
                edge="end"
                aria-label="pull"
                size="small"
                onClick={() => pullImage(image)}
              >
                <StatusDisplay status={pullStatus} />
              </IconButton>
            </Box>
          </Tooltip>
        ),
      }}
    />
  )
}

export default DockerImageField
