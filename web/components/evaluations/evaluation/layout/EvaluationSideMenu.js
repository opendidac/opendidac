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
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  EvaluationPhase,
  StudentAnswerStatus,
  UserOnEvaluationAccessMode,
} from '@prisma/client'

import SettingsSharpIcon from '@mui/icons-material/SettingsSharp'
import FormatListNumberedSharpIcon from '@mui/icons-material/FormatListNumberedSharp'
import PeopleSharpIcon from '@mui/icons-material/PeopleSharp'
import ModelTrainingSharpIcon from '@mui/icons-material/ModelTrainingSharp'
import GradingSharpIcon from '@mui/icons-material/GradingSharp'
import { Box, Stack } from '@mui/system'
import { phaseGreaterThan } from '../phases'
import StatusDisplay from '@/components/feedback/StatusDisplay'
import Image from 'next/image'
import { getStudentEntryLink } from '@/code/utils'
import Link from 'next/link'

const EvaluationSideMenu = ({
  groupScope,
  evaluation,
  composition,
  attendance,
  progress,
  results,
  currentPhase,
  active,
  setActive,
}) => {
  const isPurged = Boolean(evaluation.purgedAt)

  const disableForPhaseOrPurge = (phase) => {
    const phaseDisabled = phaseGreaterThan(phase, currentPhase)
    const purgeDisabled =
      isPurged &&
      (phase === EvaluationPhase.IN_PROGRESS ||
        phase === EvaluationPhase.GRADING)
    return phaseDisabled || purgeDisabled
  }

  const overallProgress = (progress) => {
    if (!progress) return 0

    let totalAnswers = 0
    let completedAnswers = 0

    progress.forEach((q) => {
      totalAnswers += q.question.studentAnswer.length
      completedAnswers += q.question.studentAnswer.filter(
        (a) => a.status !== StudentAnswerStatus.MISSING,
      ).length
    })

    if (totalAnswers === 0) return 0
    return Math.round((completedAnswers / totalAnswers) * 100)
  }

  const overallGrading = (results) => {
    if (!results) return 0

    let totalGraded = 0
    let graded = 0

    results.forEach((q) => {
      totalGraded += q.question.studentAnswer.length
      graded += q.question.studentAnswer.filter(
        (a) => a.studentGrading?.signedBy,
      ).length
    })

    if (totalGraded === 0) return 0
    return Math.round((graded / totalGraded) * 100)
  }

  return (
    <MenuList>
      <EvaluationMenuItem
        icon={SettingsSharpIcon}
        label="Settings"
        phase={EvaluationPhase.SETTINGS}
        currentPhase={currentPhase}
        active={active}
        setActive={setActive}
        menuKey="settings"
        disabled={disableForPhaseOrPurge(EvaluationPhase.SETTINGS)}
        summary={<SettingsSummary evaluation={evaluation} />}
      />

      <EvaluationMenuItem
        icon={FormatListNumberedSharpIcon}
        label="Composition"
        details={`${composition?.length || 0} questions`}
        phase={EvaluationPhase.COMPOSITION}
        currentPhase={currentPhase}
        active={active}
        setActive={setActive}
        menuKey="composition"
        disabled={disableForPhaseOrPurge(EvaluationPhase.COMPOSITION)}
        summary={
          <CompositionSummary
            evaluation={evaluation}
            composition={composition}
          />
        }
      />

      <EvaluationMenuItem
        icon={PeopleSharpIcon}
        label="Attendance"
        details={
          <>
            <Tooltip
              title="Copy invitation link to clipboard"
              key="add-link-to-clipboard"
            >
              <IconButton
                onClick={(ev) => {
                  ev.preventDefault()
                  ev.stopPropagation()
                  ;(async () => {
                    await navigator.clipboard.writeText(
                      getStudentEntryLink(evaluation.id),
                    )
                  })()
                }}
              >
                <Image
                  alt="Copy link"
                  src="/svg/icons/link.svg"
                  width="18"
                  height="18"
                />
              </IconButton>
            </Tooltip>
            {attendance.registered?.length} registered
          </>
        }
        phase={EvaluationPhase.REGISTRATION}
        currentPhase={currentPhase}
        active={active}
        setActive={setActive}
        menuKey="attendance"
        disabled={disableForPhaseOrPurge(EvaluationPhase.REGISTRATION)}
        summary={<AttendanceSummary attendance={attendance} />}
      />

      <EvaluationMenuItem
        icon={ModelTrainingSharpIcon}
        label="In Progress"
        details={
          isPurged ? (
            <Typography variant="body2" color="error">
              Purged
            </Typography>
          ) : (
            <>
              <Link
                href={`/${groupScope}/evaluations/${evaluation.id}/analytics`}
                passHref
                key="analytics"
                target="_blank"
              >
                <Tooltip title="Open Analytics Page">
                  <IconButton
                    component="span"
                    onClick={(event) => event.stopPropagation()}
                    disabled={
                      !phaseGreaterThan(
                        currentPhase,
                        EvaluationPhase.REGISTRATION,
                      )
                    }
                  >
                    <Image
                      alt="Analytics"
                      src="/svg/icons/analytics.svg"
                      width="18"
                      height="18"
                    />
                  </IconButton>
                </Tooltip>
              </Link>
              {overallProgress(progress)}% completed
            </>
          )
        }
        phase={EvaluationPhase.IN_PROGRESS}
        currentPhase={currentPhase}
        active={active}
        setActive={setActive}
        menuKey="progress"
        disabled={disableForPhaseOrPurge(EvaluationPhase.IN_PROGRESS)}
        summary={<ProgressSummary progress={progress} />}
      />

      <EvaluationMenuItem
        icon={GradingSharpIcon}
        label="Results & Feedback"
        details={
          isPurged ? (
            <Typography variant="body2" color="error">
              Purged
            </Typography>
          ) : (
            `${overallGrading(results)}%`
          )
        }
        phase={EvaluationPhase.GRADING}
        currentPhase={currentPhase}
        active={active}
        setActive={setActive}
        menuKey="results"
        disabled={disableForPhaseOrPurge(EvaluationPhase.GRADING)}
        summary={<GradingSummary results={results} />}
      />
    </MenuList>
  )
}

const EvaluationMenuItem = ({
  icon: Icon,
  label,
  details,
  summary,
  phase,
  currentPhase,
  active,
  setActive,
  menuKey,
  disabled,
}) => {
  const renderStatus = () => {
    if (phaseGreaterThan(currentPhase, phase))
      return <StatusDisplay status={'SUCCESS'} />
    if (currentPhase === phase) return <StatusDisplay status={'NEUTRAL'} />
    return <StatusDisplay status={'EMPTY'} />
  }

  return (
    <>
      <MenuItem
        selected={active === menuKey}
        onClick={() => setActive(menuKey)}
        disabled={disabled}
      >
        <ListItemIcon>
          <Icon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{label}</ListItemText>

        {details && (
          <Typography variant="body2" color="text.secondary">
            {details}
          </Typography>
        )}

        <Box ml={0.5}>{renderStatus()}</Box>
      </MenuItem>

      {summary && !disabled && (
        <Stack pt={1} pl={2} pb={2}>
          {summary}
        </Stack>
      )}
    </>
  )
}
const SettingsSummary = ({ evaluation }) => {
  const isAccessListRestricted =
    evaluation.accessMode === UserOnEvaluationAccessMode.LINK_AND_ACCESS_LIST

  const isIpRestricted =
    evaluation.ipRestrictions && evaluation.ipRestrictions.length > 0

  const isLabelDefined = evaluation.label && evaluation.label.length > 0

  const isAccessRestricted = isAccessListRestricted || isIpRestricted

  return (
    <Stack spacing={0}>
      {!isLabelDefined && (
        <Typography variant="caption" color="error">
          - Label is required.
        </Typography>
      )}
      {isAccessRestricted ? (
        <Typography variant="caption">- Restricted access</Typography>
      ) : (
        <Typography variant="caption">
          - Anyone with the link can access
        </Typography>
      )}
      {isAccessListRestricted && (
        <Typography variant="caption" pl={2}>
          - Access list restriction is active.
        </Typography>
      )}
      {isAccessListRestricted && evaluation.accessList?.length > 0 && (
        <Typography variant="caption" pl={2}>
          - Access list contains {evaluation.accessList.length} students
        </Typography>
      )}
      {evaluation.ipRestrictions && (
        <Typography variant="caption" pl={2}>
          - IP restrictions are active.
        </Typography>
      )}
      {evaluation.conditions ? (
        <Typography variant="caption">- Conditions are set.</Typography>
      ) : (
        <Typography variant="caption">- No conditions are set.</Typography>
      )}
      {evaluation.durationHours > 0 || evaluation.durationMins > 0 ? (
        <Typography variant="caption">
          - Duration: {evaluation.durationHours}h {evaluation.durationMins}m.
        </Typography>
      ) : (
        <Typography variant="caption">- No duration set.</Typography>
      )}
      <Typography variant="caption">
        - Consultation:{' '}
        {evaluation.consultationEnabled ? 'Enabled' : 'Disabled'}, Solutions:{' '}
        {evaluation.showSolutionsWhenFinished ? 'Visible' : 'Hidden'}
      </Typography>
    </Stack>
  )
}

const CompositionSummary = ({ evaluation, composition }) => {
  return (
    <Stack>
      <Typography
        variant="caption"
        color={composition?.length === 0 ? 'error' : 'text.primary'}
      >
        - {composition?.length} questions.
      </Typography>
      <Typography variant="caption">
        - {composition?.reduce((acc, q) => acc + q.weightedPoints, 0)} points.
      </Typography>
      {phaseGreaterThan(evaluation.phase, EvaluationPhase.COMPOSITION) ? (
        <>
          <Typography variant="caption">
            {' '}
            - Composition is completed.
          </Typography>
          <Typography variant="caption">
            {' '}
            - Questions are copied to the evaluation.
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="caption">
            - Composition is open for changes.
          </Typography>
          <Typography variant="caption">
            - Questions are linked to the evaluation.
          </Typography>
        </>
      )}
    </Stack>
  )
}

const AttendanceSummary = ({ attendance }) => {
  return (
    <Stack>
      <Typography variant="caption">
        - {attendance.registered?.length} students registered.
      </Typography>
      {attendance.denied?.length > 0 && (
        <Typography variant="caption" color={'error'}>
          - {attendance.denied?.length} students denied.
        </Typography>
      )}
    </Stack>
  )
}

const ProgressSummary = ({ progress }) => {
  const countAnswers = (progress, status = StudentAnswerStatus.MISSING) => {
    if (!progress) return 0

    let count = 0

    progress.forEach((question) => {
      count += question.question.studentAnswer.filter(
        (answer) => answer.status === status,
      ).length
    })

    return count
  }

  const totalAnswers = (progress) => {
    if (!progress) return 0

    let count = 0

    progress.forEach((question) => {
      count += question.question.studentAnswer.length
    })

    return count
  }

  const inProgressAnswers = countAnswers(
    progress,
    StudentAnswerStatus.IN_PROGRESS,
  )
  const submittedAnswers = countAnswers(progress, StudentAnswerStatus.SUBMITTED)

  const inProgressAnswerPercentage = Math.round(
    (inProgressAnswers / totalAnswers(progress)) * 100,
  )
  const submittedAnswerPercentage = Math.round(
    (submittedAnswers / totalAnswers(progress)) * 100,
  )

  return (
    <Stack spacing={0}>
      <Typography variant="caption">
        - In progress answers {inProgressAnswers} out of{' '}
        {totalAnswers(progress)} ({inProgressAnswerPercentage}%).
      </Typography>
      <Typography variant="caption">
        - Submitted answers {submittedAnswers} out of {totalAnswers(progress)} (
        {submittedAnswerPercentage}%).
      </Typography>
    </Stack>
  )
}

const GradingSummary = ({ results }) => {
  if (!results) return null
  const countGraded = (results) => {
    let count = 0
    results.forEach((question) => {
      count += question.question.studentAnswer.filter(
        (answer) => answer.studentGrading.signedBy,
      ).length
    })
    return count
  }

  const totalGraded = (results) => {
    let count = 0
    results.forEach((question) => {
      count += question.question.studentAnswer.length
    })
    return count
  }

  // Signed / Total
  const graded = countGraded(results)
  const gradedPercentage = Math.round((graded / totalGraded(results)) * 100)

  // Awarded points
  const awardedPoints = results.reduce(
    (acc, result) =>
      acc +
      result.question.studentAnswer
        .filter((answer) => answer.studentGrading.signedBy)
        .reduce((acc, answer) => acc + answer.studentGrading.pointsObtained, 0),
    0,
  )

  // Total points for signed answers
  const totalPointsForGraded = results.reduce(
    (acc, result) =>
      acc +
      result.question.studentAnswer
        .filter((answer) => answer.studentGrading.signedBy)
        .reduce((acc, answer) => acc + result.points, 0),
    0,
  )

  // Success rate based on signed grading
  const successRate = () => {
    if (totalPointsForGraded === 0) return 0
    return Math.round((awardedPoints / totalPointsForGraded) * 100)
  }

  return (
    <Stack>
      <Typography variant="caption">
        - Graded answers {graded} out of {totalGraded(results)} (
        {gradedPercentage}%).
      </Typography>
      <Typography variant="caption">
        - Awarded points {awardedPoints} out of {totalPointsForGraded}.
      </Typography>
      <Typography variant="caption">
        - Success rate {successRate()}%.
      </Typography>
    </Stack>
  )
}

export default EvaluationSideMenu
