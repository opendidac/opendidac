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

import PiePercent from '@/components/feedback/PiePercent'
import UserAvatar from '@/components/layout/UserAvatar'
import DataGrid from '@/components/ui/DataGrid'
import { ButtonBase, Divider, Stack, Tooltip, Typography } from '@mui/material'
import React, { useState, useEffect } from 'react'
import { useTheme } from '@emotion/react'

const StudentResultsGrid = ({
  attendance,
  results,
  actions,
  questionCellClick,
  selectedQuestionCell,
}) => {
  const theme = useTheme()

  const [participants, setParticipants] = useState([])

  useEffect(() => {
    setParticipants(attendance.registered.map((r) => r.user))
  }, [attendance])

  if (!results) {
    return null
  }

  const gridHeaders = () => {
    let q = results.map((jstq) => ({
      label: <b>{`Q${jstq.order + 1}`}</b>,
      tooltip: jstq.title || jstq.question.title,
      column: { width: '35px', align: 'center', minWidth: '35px' },
      renderCell: (row) => {
        const data = row[`Q${jstq.order + 1}`]
        const color = data.signed
          ? data.successRate > 70
            ? theme.palette.success.main
            : data.successRate > 40
              ? theme.palette.info.main
              : theme.palette.error.main
          : theme.palette.grey['300']
        const pointsObtained = data.pointsObtained
        const totalPoints = data.totalPoints

        const selected =
          selectedQuestionCell &&
          selectedQuestionCell.questionId === jstq.question.id &&
          selectedQuestionCell.participantId === row.participant.id
        return (
          <ButtonBase
            sx={{
              padding: 1,
              bgcolor: selected ? theme.palette.grey['200'] : 'transparent',
            }}
            onClick={(ev) => {
              ev.stopPropagation()
              questionCellClick &&
                questionCellClick(jstq.question.id, row.participant.id)
            }}
          >
            <Stack
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              spacing={0.1}
            >
              <Typography
                variant="body2"
                sx={{ color: color }}
              >{`${pointsObtained}`}</Typography>
              <Divider
                sx={{
                  width: '100%',
                  borderBottom: '1px solid',
                  borderColor: color,
                }}
              />
              <Typography
                variant="body2"
                sx={{ color: color }}
              >{`${totalPoints}`}</Typography>
            </Stack>
          </ButtonBase>
        )
      },
    }))

    const columns = [
      {
        label: 'Participant',
        column: { flexGrow: 1, minWidth: '200px' },
        renderCell: (row) => <UserAvatar user={row.participant} />,
      },
    ]

    if (actions) {
      columns.push({
        label: 'Actions',
        column: { width: '80px', minWidth: '80px' },
        renderCell: (row) => actions(row),
      })
    }

    columns.push({
      label: 'Success',
      column: { width: '80px', minWidth: '80px' },
      renderCell: (row) => (
        <PiePercent
          size={60}
          value={row.participantSuccessRate}
          label={
            <Tooltip title={'Based on signed gradings'}>
              <Stack alignItems="center" justifyContent="center" spacing={0}>
                <Typography variant="body2">{`${row.obtainedPoints}`}</Typography>
                <Divider sx={{ width: '100%' }} />
                <Typography variant="caption">{`${row.totalPoints}`}</Typography>
              </Stack>
            </Tooltip>
          }
        />
      ),
    })

    columns.push(...q)

    return {
      columns: columns,
    }
  }

  const gridRows = () =>
    participants.map((participant) => {
      // Initialize variables for signed evaluations
      let signedObtainedPoints = 0
      let signedTotalPoints = 0

      const questionColumnValues = {}

      results.forEach((jstq) => {
        const grading = jstq.question.studentAnswer.find(
          (sa) => sa.user.email === participant.email,
        )?.studentGrading

        let pointsObtained = grading ? grading.pointsObtained : 0
        let totalPoints = jstq.points

        if (grading?.signedBy !== null) {
          // Accumulate points only for signed evaluations
          signedObtainedPoints += pointsObtained
          signedTotalPoints += totalPoints
        }

        let successRate =
          totalPoints > 0
            ? parseFloat(((pointsObtained / totalPoints) * 100).toFixed(2))
            : 0

        questionColumnValues[`Q${jstq.order + 1}`] = {
          pointsObtained: parseFloat(pointsObtained.toFixed(2)),
          totalPoints: parseFloat(totalPoints.toFixed(2)),
          successRate: successRate,
          signed: grading?.signedBy,
        }
      })

      // Compute participant success rate based on signed evaluations
      let participantSuccessRate =
        signedTotalPoints > 0
          ? parseFloat(
              ((signedObtainedPoints / signedTotalPoints) * 100).toFixed(2),
            )
          : 0

      return {
        participant: participant,
        email: participant.email,
        participantSuccessRate: participantSuccessRate,
        obtainedPoints: parseFloat(signedObtainedPoints.toFixed(2)),
        totalPoints: parseFloat(signedTotalPoints.toFixed(2)),
        ...questionColumnValues,
        meta: {
          key: participant.email,
        },
      }
    })

  return <DataGrid header={gridHeaders()} items={gridRows()} />
}

export default StudentResultsGrid
