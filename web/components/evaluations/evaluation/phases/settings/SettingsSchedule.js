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
import {
  Stack,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material'
import DurationPicker from '@/components/input/DurationPicker'

const SettingsSchedule = ({
  active: initialActive,
  duration: initialDuration,
  onChange,
}) => {
  const [useDuration, setUseDuration] = useState(initialActive)

  const [duration, setDuration] = useState({
    hours: 0,
    minutes: 0,
  })

  useEffect(() => {
    setDuration({
      hours: initialDuration?.hours || 0,
      minutes: initialDuration?.minutes || 0,
    })
  }, [initialDuration])

  useEffect(() => {
    setUseDuration(initialActive)
  }, [initialActive])

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Schedule</Typography>
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={useDuration}
              onChange={(e) => {
                setUseDuration(e.target.checked)
                onChange({
                  active: e.target.checked,
                  ...duration,
                })
              }}
            />
          }
          label="Set duration"
        />
      </FormGroup>
      {useDuration && (
        <DurationPicker
          disabled={!useDuration}
          value={duration}
          onChange={(value) => {
            setDuration(value)
            onChange({
              active: true,
              ...value,
            })
          }}
        />
      )}
      <Alert severity="info">
        <Typography variant="body1" component={'span'}>
          The sole purpose of this feature is to give students an idea of the
          time they have to complete the evaluation.
        </Typography>
        <Typography variant="body1" component={'span'}>
          The evaluation will not end automatically. You will have to end it
          manually in the in-progress phase.
        </Typography>
      </Alert>
    </Stack>
  )
}

export default SettingsSchedule
