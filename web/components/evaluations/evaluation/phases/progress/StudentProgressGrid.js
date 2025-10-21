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

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { StudentAnswerStatus, UserOnEvaluationStatus } from '@prisma/client'
import { IconButton, Stack, Tooltip, Typography } from '@mui/material'

import UserAvatar from '@/components/layout/UserAvatar'
import Datagrid from '@/components/ui/DataGrid'
import FilledBullet from '@/components/feedback/FilledBullet'
import PiePercent from '@/components/feedback/PiePercent'

import DropdownSelector from '@/components/input/DropdownSelector'
import DateTimeCell from '@/components/layout/utils/DateTimeCell'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'
import { differenceInHours, differenceInMinutes } from 'date-fns'

const StudentStatusManager = ({
  groupScope,
  evaluationId,
  userEmail,
  status: initial,
  onChange,
}) => {
  const [status, setStatus] = useState(initial)

  useEffect(() => {
    setStatus(initial)
  }, [initial])

  const statusToColor = {
    [UserOnEvaluationStatus.IN_PROGRESS]: 'success',
    [UserOnEvaluationStatus.FINISHED]: 'error',
  }

  const statusToText = {
    [UserOnEvaluationStatus.IN_PROGRESS]: 'In progress',
    [UserOnEvaluationStatus.FINISHED]: 'Finished',
  }

  const statusToTooltip = {
    [UserOnEvaluationStatus.IN_PROGRESS]:
      'The student is currently allowed to work on the evaluation',
    [UserOnEvaluationStatus.FINISHED]:
      'The student has finished and is no longer allowed to work on the evaluation',
  }

  const handleStatusChange = useCallback(
    async (status) => {
      await fetch(
        `/api/${groupScope}/evaluations/${evaluationId}/students/${userEmail}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
          }),
        },
      )
        .then((res) => res.json())
        .then((res) => {
          setStatus(res.status)
          if (onChange) onChange(res.status)
        })
    },
    [evaluationId, userEmail, onChange, groupScope],
  )

  const Option = ({ value }) => (
    <Tooltip title={statusToTooltip[value]} placement={'left'}>
      <Stack direction={'row'} spacing={1}>
        <FilledBullet state={'filled'} color={statusToColor[value]} />
        <Typography variant={'caption'} noWrap>
          {statusToText[value]}
        </Typography>
      </Stack>
    </Tooltip>
  )

  return (
    <DropdownSelector
      color={statusToColor[status]}
      variant={'text'}
      label={(option) => <Option value={option.value} />}
      value={status}
      options={[
        {
          label: <Option value={UserOnEvaluationStatus.IN_PROGRESS} />,
          value: UserOnEvaluationStatus.IN_PROGRESS,
        },
        {
          label: <Option value={UserOnEvaluationStatus.FINISHED} />,
          value: UserOnEvaluationStatus.FINISHED,
        },
      ]}
      onSelect={async (value) => await handleStatusChange(value)}
    />
  )
}

const StudentProgressGrid = ({
  groupScope,
  evaluationId,
  students,
  progress = [],
  onChange,
}) => {
  const columns = [
    {
      label: 'Student',
      column: { minWidth: 230, flexGrow: 1 },
      renderCell: (row) => {
        const registeredAt = new Date(row.registeredAt)
        const sessionChangeDetectedAt = new Date(row.sessionChangeDetectedAt)

        // Calculate the time difference
        const minutesElapsed = differenceInMinutes(
          sessionChangeDetectedAt,
          registeredAt,
        )
        const hoursElapsed = differenceInHours(
          sessionChangeDetectedAt,
          registeredAt,
        )

        return (
          <Stack
            direction={'row'}
            spacing={1}
            alignItems={'center'}
            justifyContent={'space-between'}
          >
            <UserAvatar user={row.user} />
            {row.hasSessionChanged && (
              <UserHelpPopper
                mode={'warning'}
                label={'Session change detected'}
              >
                <Typography variant={'body1'}>
                  We noticed that this student logged in again during the
                  evaluation, potentially from a different device or browser.
                </Typography>

                {/* Display the time elapsed since registration */}
                <Typography variant={'body1'}>
                  <b>Latest</b> session change was detected{' '}
                  <b>
                    {hoursElapsed > 0
                      ? `${hoursElapsed} hours and ${minutesElapsed % 60} minutes`
                      : `${minutesElapsed} minutes`}{' '}
                    after the student registered.
                  </b>
                </Typography>

                <Typography variant={'body1'}>
                  This could mean the student switched devices or shared their
                  login details with someone else.
                </Typography>
                <Typography variant={'body1'}>
                  <strong>Important:</strong> If this is unexpected or
                  suspicious, you may want to check with the student.
                </Typography>
                <Typography variant={'body1'}>
                  <strong>Tip:</strong> Make sure to check that the student is
                  actively working on their screen and not just sitting on the
                  login screen.
                </Typography>
              </UserHelpPopper>
            )}
          </Stack>
        )
      },
    },

    {
      label: 'Registered',
      column: { minWidth: 90, width: 90 },
      renderCell: (row) => <DateTimeCell dateTime={row.registeredAt} />,
    },
  ]

  const getBulletState = (studentAnswerStatus) => {
    switch (studentAnswerStatus) {
      case StudentAnswerStatus.MISSING:
        return 'empty'
      case StudentAnswerStatus.IN_PROGRESS:
        return 'half'
      case StudentAnswerStatus.SUBMITTED:
        return 'filled'
      default:
        return 'empty'
    }
  }

  // Utility function to get users's answer status by question id and users email
  const getStudentAnswerStatus = useCallback(
    (studentEmail, questionId) => {
      const relevantQuestion = progress.find(
        (q) => q.question.id === questionId,
      )

      if (!relevantQuestion) return StudentAnswerStatus.MISSING

      const answer = relevantQuestion.question.studentAnswer.find(
        (sa) => sa.user.email === studentEmail,
      )
      return answer ? answer.status : StudentAnswerStatus.MISSING
    },
    [progress],
  )

  // Utility function to calculate the percentage of submitted answers for a users
  const getSubmissionPercentage = useCallback(
    (studentEmail) => {
      const submittedAnswersCount = progress.reduce((count, q) => {
        const answer = q.question.studentAnswer.find(
          (sa) =>
            sa.userEmail === studentEmail &&
            sa.status === StudentAnswerStatus.SUBMITTED,
        )
        return answer ? count + 1 : count
      }, 0)

      return Math.round((submittedAnswersCount / progress.length) * 100)
    },
    [progress],
  )

  // Create dynamic columns for each question
  const questionColumns = useMemo(
    () =>
      progress.map((q) => ({
        label: `Q${q.order + 1}`, // Assuming questions order starts at 0
        tooltip: q.title || q.question.title,
        column: { width: 40, minWidth: 40 },
        renderCell: (row) => (
          <FilledBullet
            state={getBulletState(
              getStudentAnswerStatus(row.user.email, q.question.id),
            )}
          />
        ),
      })),
    [progress, getStudentAnswerStatus],
  )

  if (questionColumns.length > 0) {
    columns.push({
      label: 'Finished',
      column: { minWidth: 90, width: 90 },
      renderCell: (row) => {
        return row.finishedAt ? (
          <DateTimeCell dateTime={row.finishedAt} />
        ) : (
          <Typography variant={'caption'}>/</Typography>
        )
      },
    })
    columns.push({
      label: 'Status',
      column: { minWidth: 150, width: 150 },
      renderCell: (row) => {
        return (
          <StudentStatusManager
            groupScope={groupScope}
            evaluationId={evaluationId}
            userEmail={row.user.email}
            status={row.status}
            onChange={() => {
              onChange && onChange()
            }}
          />
        )
      },
    })
    columns.push({
      label: '',
      column: { minWidth: 40, width: 40 },
      renderCell: (row) => {
        return (
          <Stack direction={'row'} spacing={1} alignItems={'center'}>
            <Tooltip title="Spy student" key="view-student-answers">
              <a
                href={`/${groupScope}/evaluations/${evaluationId}/consult/${row.user.email}/1`}
                target="_blank"
              >
                <IconButton size="small">
                  <Image
                    alt="View"
                    src="/svg/icons/view-user.svg"
                    width="18"
                    height="18"
                  />
                </IconButton>
              </a>
            </Tooltip>
          </Stack>
        )
      },
    })
    columns.push({
      label: (
        <Tooltip
          title="Percentage of Submitted answers"
          key="submission-percentage"
        >
          <Typography variant="caption">Overall </Typography>
        </Tooltip>
      ),
      column: { minWidth: 70, width: 70 },
      renderCell: (row) => (
        <PiePercent value={getSubmissionPercentage(row.user.email) || 0} />
      ),
    })
    columns.push(...questionColumns)
  }

  return (
    <Datagrid
      header={{ columns: columns }}
      items={students?.map((student) => ({
        ...student,
        meta: {
          key: student.user.id,
        },
      }))}
    />
  )
}

export default StudentProgressGrid
