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
import { useEffect, useState } from 'react'
import ToggleWithLabel from '@/components/input/ToggleWithLabel'
import { Alert, AlertTitle, Typography, Stack, TextField } from '@mui/material'

const ConsultationSettings = ({ evaluation, onChange }) => {
  const [showSolutionsWhenFinished, setShowSolutionsWhenFinished] = useState(
    evaluation.showSolutionsWhenFinished,
  )
  const [consultationEnabled, setConsultationEnabled] = useState(
    evaluation.consultationEnabled,
  )
  const [ipRestrictions, setIpRestrictions] = useState(
    evaluation.ipRestrictions || '',
  )
  const [ipError, setIpError] = useState('')

  useEffect(() => {
    setShowSolutionsWhenFinished(evaluation.showSolutionsWhenFinished)
    setConsultationEnabled(evaluation.consultationEnabled)
    setIpRestrictions(evaluation.ipRestrictions || '')
  }, [
    evaluation.showSolutionsWhenFinished,
    evaluation.consultationEnabled,
    evaluation.ipRestrictions,
  ])

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
      onChange(consultationEnabled, showSolutionsWhenFinished, value)
    }
  }

  const handleConsultationChange = (checked) => {
    setConsultationEnabled(checked)
    if (!checked) {
      setShowSolutionsWhenFinished(false)
      onChange(checked, false, ipRestrictions)
    } else {
      onChange(checked, showSolutionsWhenFinished, ipRestrictions)
    }
  }

  const handleSolutionsChange = (checked) => {
    setShowSolutionsWhenFinished(checked)
    onChange(consultationEnabled, checked, ipRestrictions)
  }

  return (
    <>
      <Typography variant="h5">Consultation settings</Typography>
      <Stack spacing={2}>
        <Stack spacing={2} direction="row">
          <ToggleWithLabel
            label="Enable consultation after grading"
            checked={consultationEnabled}
            onChange={(e) => handleConsultationChange(e.target.checked)}
          />
          <ToggleWithLabel
            label="Allow student to view official solutions"
            checked={showSolutionsWhenFinished}
            disabled={!consultationEnabled}
            onChange={(e) => handleSolutionsChange(e.target.checked)}
          />
        </Stack>

        <Alert severity="info">
          <AlertTitle>Enable consultation after grading</AlertTitle>
          <Typography variant="body2">
            Controls whether students can view their feedback, grades, or other
            consultation data after the grading phase.
          </Typography>
          <Typography variant="body2">
            - For <b>Exams</b>, consultation is disabled by default to ensure
            that students cannot access feedback or grades after the exam is
            over, maintaining confidentiality.
          </Typography>
          <Typography variant="body2">
            - For <b>TE (tests)</b> and <b>Training</b>, consultation is
            typically enabled to offer valuable feedback for continuous
            improvement and learning.
          </Typography>
          <Typography variant="body2">
            Note: Disabling consultation will also disable the ability to show
            solutions.
          </Typography>
        </Alert>

        <Alert severity="info">
          <AlertTitle>Allow student to view official solutions</AlertTitle>
          <Typography variant="body2">
            Controls whether students can see the official solutions to the
            evaluation once it is completed.
          </Typography>
          <Typography variant="body2">
            - For <b>Exams</b> and <b>TE (tests)</b>, this setting should
            generally be disabled to maintain confidentiality.
          </Typography>
          <Typography variant="body2">
            - For <b>Training</b>, enabling this setting helps students compare
            their answers with the correct ones, fostering learning.
          </Typography>
        </Alert>

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

export default ConsultationSettings
