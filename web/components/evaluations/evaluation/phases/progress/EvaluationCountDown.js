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
import { useState, useEffect, useCallback } from 'react'
import { Typography, Chip, Stack } from '@mui/material'
import DateCountdown from '@/components/ui/DateCountdown'
import PiePercent from '@/components/feedback/PiePercent'

const EvaluationCountDown = ({ startDate, endDate, onFinish = undefined }) => {
  const [percentage, setPercentage] = useState(100)

  const updatePercentage = useCallback(() => {
    // percentage of now between start and end
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    const duration = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    const newPercentage = (elapsed / duration) * 100
    setPercentage(newPercentage)
  }, [startDate, endDate])

  useEffect(() => {
    // first render init percentage
    updatePercentage()
  }, [updatePercentage])

  return (
    <Chip
      avatar={
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ bgcolor: 'white', borderRadius: '50%' }}
        >
          <PiePercent
            value={percentage}
            size={24}
            thickness={22}
            label=" "
            colors={{
              0: '#2e7d32',
              40: '#0288d1',
              70: '#d32f2f',
            }}
          />
        </Stack>
      }
      label={
        <Typography variant="button">
          <DateCountdown
            untilDate={endDate}
            onTic={updatePercentage}
            onFinish={onFinish}
          />
        </Typography>
      }
    />
  )
}

export default EvaluationCountDown
