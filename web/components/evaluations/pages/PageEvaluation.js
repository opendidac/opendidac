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

import { useRouter } from 'next/router'
import useSWR from 'swr'
import { getPhaseDetails, phaseGreaterThan } from '../evaluation/phases'
import { phaseGT } from '@/core/phase'
import { fetcher } from '@/core/utils'
import Authorization from '@/components/security/Authorization'
import Loading from '@/components/feedback/Loading'
import LayoutMain from '@/components/layout/LayoutMain'
import { Stack } from '@mui/system'
import BackButton from '@/components/layout/BackButton'
import { Typography } from '@mui/material'
import DisplayPhase from '../DisplayPhase'
import LayoutSplitScreen from '@/components/layout/LayoutSplitScreen'
import EvaluationSideMenu from '../evaluation/layout/EvaluationSideMenu'
import EvaluationActionMenu from '../evaluation/layout/EvaluationActionMenu'
import EvaluationSettings from '../evaluation/phases/EvaluationSettings'
import EvaluationComposition from '../evaluation/phases/EvaluationComposition'
import EvaluationAttendance from '../evaluation/phases/EvaluationAttendance'
import EvaluationInProgress from '../evaluation/phases/EvaluationInProgress'
import EvaluationResults from '../evaluation/phases/EvaluationResults'
import { useEffect, useState } from 'react'
import { Role, EvaluationPhase } from '@prisma/client'
import ArchivalStatusStamp from '../../admin/archiving/ArchivalStatusStamp'

const STUDENTS_ATTENDANCE_PULL_INTERVAL = 1000
const STUDENTS_PROGRESS_PULL_INTERVAL = 5000

// --- Disable logic owned by parent so we can auto-switch on purge/phase change ---
const PHASE_BY_MENU = {
  settings: EvaluationPhase.SETTINGS,
  composition: EvaluationPhase.COMPOSITION,
  attendance: EvaluationPhase.REGISTRATION,
  progress: EvaluationPhase.IN_PROGRESS,
  results: EvaluationPhase.GRADING,
}

const EvaluationPage = () => {
  const router = useRouter()
  const { groupScope, evaluationId } = router.query

  const [activeMenu, setActiveMenu] = useState(null)

  const shouldFetchPhase = groupScope && evaluationId

  const {
    data: phase,
    error: errorPhase,
    mutate: mutatePhase,
  } = useSWR(
    shouldFetchPhase
      ? `/api/${groupScope}/evaluations/${evaluationId}/phase`
      : null,
    fetcher,
  )

  useEffect(() => {
    if (phase) {
      setActiveMenu(getPhaseDetails(phase.phase).menu)
    }
  }, [phase])

  const shouldFetchEvaluation = groupScope && evaluationId

  const {
    data: evaluation,
    error,
    mutate,
  } = useSWR(
    shouldFetchEvaluation
      ? `/api/${groupScope}/evaluations/${evaluationId}`
      : null,
    fetcher,
  )

  const shouldFetchComposition = groupScope && evaluationId && evaluation

  const {
    data: composition,
    error: errorComposition,
    mutate: mutateComposition,
  } = useSWR(
    shouldFetchComposition
      ? `/api/${groupScope}/evaluations/${evaluationId}/composition`
      : null,
    fetcher,
  )

  const shouldFetchAttendance =
    groupScope &&
    evaluationId &&
    evaluation &&
    !phaseGT(EvaluationPhase.REGISTRATION, evaluation.phase)

  const {
    data: attendance,
    error: errorAttendance,
    mutate: mutateAttendance,
  } = useSWR(
    shouldFetchAttendance
      ? `/api/${groupScope}/evaluations/${evaluationId}/attendance`
      : null,
    fetcher,
    {
      refreshInterval: shouldFetchAttendance
        ? STUDENTS_ATTENDANCE_PULL_INTERVAL
        : 0,
    },
  )

  const shouldFetchProgress =
    groupScope &&
    evaluationId &&
    evaluation &&
    !phaseGT(EvaluationPhase.IN_PROGRESS, evaluation.phase)

  const {
    data: progress,
    error: errorProgress,
    mutate: mutateProgress,
  } = useSWR(
    shouldFetchProgress
      ? `/api/${groupScope}/evaluations/${evaluationId}/progress`
      : null,
    fetcher,
    { refreshInterval: STUDENTS_PROGRESS_PULL_INTERVAL },
  )

  const shouldFetchResults =
    groupScope &&
    evaluationId &&
    evaluation &&
    phaseGT(evaluation.phase, EvaluationPhase.IN_PROGRESS)

  const {
    data: results,
    error: errorResults,
    mutate: mutateResults,
  } = useSWR(
    shouldFetchResults
      ? `/api/${groupScope}/evaluations/${evaluationId}/results`
      : null,
    fetcher,
  )

  const isMenuDisabled = (key) => {
    if (!evaluation) return false
    const p = PHASE_BY_MENU[key]
    if (!p) return false
    const phaseDisabled = phaseGreaterThan(p, evaluation.phase)
    const purgeDisabled =
      Boolean(evaluation.purgedAt) &&
      (p === EvaluationPhase.IN_PROGRESS || p === EvaluationPhase.GRADING)
    return phaseDisabled || purgeDisabled
  }

  // If the active menu becomes disabled (e.g., after purge), hop to a safe fallback
  useEffect(() => {
    if (!activeMenu || !evaluation) return
    if (isMenuDisabled(activeMenu)) {
      for (const key of ['attendance', 'composition', 'settings']) {
        if (!isMenuDisabled(key)) {
          setActiveMenu(key)
          break
        }
      }
    }
  }, [evaluation?.purgedAt, evaluation?.phase, activeMenu]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Authorization allowRoles={[Role.PROFESSOR]}>
      <Loading
        error={[error, errorPhase, errorComposition, errorAttendance]}
        loading={
          !evaluation ||
          !phase ||
          (shouldFetchComposition && composition === undefined) ||
          (shouldFetchAttendance && attendance === undefined)
        }
      >
        {evaluation && (
          <LayoutMain
            hideLogo
            header={
              <Stack direction="row" alignItems="center" spacing={1}>
                <BackButton backUrl={`/${groupScope}/evaluations`} />
                {phase && <DisplayPhase phase={phase.phase} />}
                {evaluation.id && (
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {evaluation.label}
                  </Typography>
                )}
              </Stack>
            }
            padding={0}
          >
            <Stack spacing={1} flex={1} sx={{ position: 'relative' }}>
              <Stack flex={1}>
                <LayoutSplitScreen
                  rightWidth={80}
                  leftPanel={
                    <Stack spacing={1}>
                      <Stack flex={1}>
                        <EvaluationSideMenu
                          groupScope={groupScope}
                          evaluation={evaluation}
                          composition={composition}
                          attendance={attendance}
                          progress={progress}
                          results={results}
                          currentPhase={evaluation.phase}
                          active={activeMenu}
                          setActive={(menu) => setActiveMenu(menu)}
                        />
                      </Stack>
                      <Stack>
                        <EvaluationActionMenu
                          groupScope={groupScope}
                          evaluation={evaluation}
                          onPhaseChange={() => {
                            mutate()
                            mutatePhase()
                          }}
                        />
                      </Stack>
                    </Stack>
                  }
                  rightPanel={
                    <Stack spacing={1} flex={1}>
                      {activeMenu === 'settings' && (
                        <EvaluationSettings
                          groupScope={groupScope}
                          evaluation={evaluation}
                          onSettingsChanged={() => mutate()}
                        />
                      )}

                      {activeMenu === 'composition' && (
                        <EvaluationComposition
                          groupScope={groupScope}
                          evaluation={evaluation}
                          composition={composition}
                          onCompositionChanged={() => {
                            mutateComposition()
                          }}
                        />
                      )}

                      {activeMenu === 'attendance' && (
                        <EvaluationAttendance
                          groupScope={groupScope}
                          evaluation={evaluation}
                          attendance={attendance}
                          onAttendanceChanged={() => mutate()}
                        />
                      )}

                      {activeMenu === 'progress' && (
                        <EvaluationInProgress
                          groupScope={groupScope}
                          evaluation={evaluation}
                          attendance={attendance}
                          progress={progress}
                          onDurationChanged={() => mutate()}
                        />
                      )}

                      {activeMenu === 'results' && (
                        <EvaluationResults
                          groupScope={groupScope}
                          evaluation={evaluation}
                          attendance={attendance}
                          results={results}
                          onResultsChanged={() => mutateResults()}
                        />
                      )}
                    </Stack>
                  }
                />
              </Stack>

              {/* Archival Status Stamp - Bottom Right Corner */}
              <ArchivalStatusStamp evaluation={evaluation} />
            </Stack>
          </LayoutMain>
        )}
      </Loading>
    </Authorization>
  )
}

export default EvaluationPage
