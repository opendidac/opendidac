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

import { Stack, Typography } from '@mui/material'
import { ArchivalPhase } from '@prisma/client'
import {
  getCurrentArchivalPhase,
  getArchivalPhaseConfig,
} from './archivalPhaseConfig'

// Small archival status indicator for list view
const ArchivalStatusMiniStamp = ({ evaluation }) => {
  const currentPhase = getCurrentArchivalPhase(evaluation)

  // Only show if there's archival activity
  if (currentPhase === ArchivalPhase.ACTIVE) {
    return null
  }

  const config = getArchivalPhaseConfig(currentPhase)
  if (!config) return null

  const CurrentIcon = config.icon

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <CurrentIcon sx={{ color: config.colorHex }} />
      <Typography
        variant="caption"
        fontWeight="bold"
        textAlign="center"
        textTransform="uppercase"
        letterSpacing="0.3px"
        color={config.colorHex}
      >
        {config.shortLabel}
      </Typography>
    </Stack>
  )
}

export default ArchivalStatusMiniStamp
