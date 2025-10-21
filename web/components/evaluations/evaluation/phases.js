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
import { EvaluationPhase } from '@prisma/client'

import SettingsSharpIcon from '@mui/icons-material/SettingsSharp'
import PeopleSharpIcon from '@mui/icons-material/PeopleSharp'
import ModelTrainingSharpIcon from '@mui/icons-material/ModelTrainingSharp'
import GradingSharpIcon from '@mui/icons-material/GradingSharp'

const phases = [
  EvaluationPhase.SETTINGS,
  EvaluationPhase.COMPOSITION,
  EvaluationPhase.REGISTRATION,
  EvaluationPhase.IN_PROGRESS,
  EvaluationPhase.GRADING,
  EvaluationPhase.FINISHED,
]

const phaseGreaterThan = (phase1, phase2) => {
  return phases.indexOf(phase1) > phases.indexOf(phase2)
}

const phaseToDetails = {
  [EvaluationPhase.SETTINGS]: {
    menu: 'settings',
    nextPhaseButton: {
      label: 'Go to composition',
      icon: SettingsSharpIcon,
    },
  },
  [EvaluationPhase.COMPOSITION]: {
    menu: 'composition',
    nextPhaseButton: {
      label: 'Go to registration',
      icon: PeopleSharpIcon,
    },
  },
  [EvaluationPhase.REGISTRATION]: {
    menu: 'attendance',
    nextPhaseButton: {
      label: 'Start evaluation',
      icon: ModelTrainingSharpIcon,
    },
  },
  [EvaluationPhase.IN_PROGRESS]: {
    menu: 'progress',
    nextPhaseButton: {
      label: 'End evaluation',
      icon: GradingSharpIcon,
    },
  },
  [EvaluationPhase.GRADING]: {
    menu: 'results',
    nextPhaseButton: {
      label: 'Finish grading',
      icon: GradingSharpIcon,
    },
  },
  [EvaluationPhase.FINISHED]: {
    menu: 'results',
  },
}

const getNextPhase = (currentPhase) => {
  return phases[phases.indexOf(currentPhase) + 1]
}

const getPhaseDetails = (phase) => {
  return phaseToDetails[phase]
}

const getNextPhaseDetails = (currentPhase) => {
  return phaseToDetails[getNextPhase(currentPhase)]
}

export { phaseGreaterThan, getNextPhase, getPhaseDetails, getNextPhaseDetails }
