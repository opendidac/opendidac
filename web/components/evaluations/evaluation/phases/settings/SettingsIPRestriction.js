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

import { useState, useEffect } from 'react'
import { Alert, AlertTitle, Typography, Stack, TextField } from '@mui/material'

const SettingsIPRestriction = ({ evaluation, onChange }) => {
  const [ipRestrictions, setIpRestrictions] = useState(
    evaluation.ipRestrictions || '',
  )
  const [ipError, setIpError] = useState('')

  useEffect(() => {
    setIpRestrictions(evaluation.ipRestrictions || '')
  }, [evaluation.ipRestrictions])

  const validateIpInput = (input) => {
    if (!input) return true

    const ipList = input.split(',').map((ip) => ip.trim())
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/
    const ipRangeRegex = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/

    return ipList.every((ip) => {
      if (ipv4Regex.test(ip)) {
        const parts = ip.split('/')
        const nums = parts[0].split('.').map((num) => parseInt(num))
        if (nums.some((num) => num > 255)) return false
        if (parts[1] && (parseInt(parts[1]) < 0 || parseInt(parts[1]) > 32))
          return false
        return true
      }
      if (ipRangeRegex.test(ip)) {
        const [start, end] = ip.split('-')
        const startNums = start.split('.').map((num) => parseInt(num))
        const endNums = end.split('.').map((num) => parseInt(num))
        return (
          !startNums.some((num) => num > 255) &&
          !endNums.some((num) => num > 255)
        )
      }
      return false
    })
  }

  const handleIpRestrictionsChange = (value) => {
    setIpRestrictions(value)
    const isValid = validateIpInput(value)
    setIpError(
      isValid
        ? ''
        : 'Invalid IP format. Use comma-separated IPv4 addresses, CIDR notation, or IP ranges',
    )
    if (isValid) {
      onChange(value)
    }
  }

  return (
    <>
      <Typography variant="h6">IP Restriction Settings</Typography>
      <Stack spacing={2}>
        <TextField
          label="IP Restrictions"
          fullWidth
          value={ipRestrictions}
          onChange={(e) => handleIpRestrictionsChange(e.target.value)}
          error={!!ipError}
          helperText={
            ipError ||
            'Enter comma-separated IP addresses, CIDR ranges (e.g., 192.168.1.0/24), or IP ranges (e.g., 192.168.1.1-192.168.1.255)'
          }
          placeholder="e.g., 192.168.1.0/24, 10.0.0.1-10.0.0.255, 172.16.0.1"
        />

        <Alert severity="info">
          <AlertTitle>IP Restrictions</AlertTitle>
          <Typography variant="body2">
            Restrict access to the evaluation based on IP addresses. You can
            specify:
          </Typography>
          <Typography variant="body2">
            - Individual IP addresses (e.g., 192.168.1.1)
          </Typography>
          <Typography variant="body2">
            - CIDR notation (e.g., 192.168.1.0/24)
          </Typography>
          <Typography variant="body2">
            - IP ranges (e.g., 192.168.1.1-192.168.1.255)
          </Typography>
          <Typography variant="body2">
            Multiple entries should be separated by commas. Leave empty to allow
            access from any IP.
          </Typography>
        </Alert>
      </Stack>
    </>
  )
}

export default SettingsIPRestriction
