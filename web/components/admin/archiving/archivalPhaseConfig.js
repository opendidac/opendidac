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
import {
  RadioButtonUnchecked,
  Schedule,
  Archive,
  DeleteForever,
} from '@mui/icons-material'
import { ArchivalPhase } from '@prisma/client'

/**
 * Shared configuration for archival phases
 * Defines display properties for each phase including colors, icons, and labels
 */
export const ARCHIVAL_PHASE_CONFIG = {
  [ArchivalPhase.ACTIVE]: {
    label: 'Active',
    shortLabel: 'ACTIVE',
    color: 'info',
    colorHex: '#1976d2',
    icon: RadioButtonUnchecked,
  },
  [ArchivalPhase.MARKED_FOR_ARCHIVAL]: {
    label: 'Marked for Archive',
    shortLabel: 'MARKED',
    color: 'warning',
    colorHex: '#ed6c02',
    icon: Schedule,
  },
  [ArchivalPhase.ARCHIVED]: {
    label: 'Archived',
    shortLabel: 'ARCHIVED',
    color: 'success',
    colorHex: '#2e7d32',
    icon: Archive,
  },
  [ArchivalPhase.PURGED]: {
    label: 'Purged',
    shortLabel: 'PURGED',
    color: 'error',
    colorHex: '#d32f2f',
    icon: DeleteForever,
  },
  [ArchivalPhase.PURGED_WITHOUT_ARCHIVAL]: {
    label: 'Purged (No Archive)',
    shortLabel: 'PURGED',
    color: 'error',
    colorHex: '#d32f2f',
    icon: DeleteForever,
  },
}

/**
 * Get configuration for a specific archival phase
 * @param {string} phase - The archival phase
 * @param {string} fallback - Fallback phase if the provided phase is not found
 * @returns {object} The phase configuration
 */
export const getArchivalPhaseConfig = (
  phase,
  fallback = ArchivalPhase.ACTIVE,
) => {
  return ARCHIVAL_PHASE_CONFIG[phase] || ARCHIVAL_PHASE_CONFIG[fallback]
}

/**
 * Get the current archival phase from an evaluation object
 * @param {object} evaluation - The evaluation object
 * @returns {string} The current archival phase
 */
export const getCurrentArchivalPhase = (evaluation) => {
  return evaluation?.archivalPhase || ArchivalPhase.ACTIVE
}
