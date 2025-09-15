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
import { useCallback, useEffect, useState } from 'react'
import { Role, StudentAnswerStatus } from '@prisma/client'
import { Box, Chip, Stack, Typography } from '@mui/material'

import { useSnackbar } from '@/context/SnackbarContext'

import Authorization from '@/components/security/Authorization'
import Loading from '@/components/feedback/Loading'
import LayoutMain from '@/components/layout/LayoutMain'
import LayoutSplitScreen from '@/components/layout/LayoutSplitScreen'
import StudentMainMenu from './take/StudentMainMenu'
import QuestionTypeIcon from '@/components/question/QuestionTypeIcon'
import DataGrid from '@/components/ui/DataGrid'
import { useTheme } from '@emotion/react'
import { LoadingButton } from '@mui/lab'
import DialogFeedback from '@/components/feedback/DialogFeedback'
import { useStudentOnEvaluation } from '@/context/StudentOnEvaluationContext'
import MarkdownViewer from '@/components/input/markdown/MarkdownViewer'

const PageEvaluationHome = () => {
  const { showTopCenter: showSnackbar } = useSnackbar()

  const {
    evaluationId,
    evaluation,
    evaluationToQuestions,

    pages,
    page,

    submitAnswer,
    mutate,
    loaded,
    error,
  } = useStudentOnEvaluation()

  const rightPenelWidth = (conditions) => {
    if (conditions?.length > 0) {
      return 60
    } else {
      return 100
    }
  }

  return (
    <Authorization allowRoles={[Role.PROFESSOR, Role.STUDENT]}>
      <Loading loading={!loaded} errors={[error]}>
        <LayoutMain
          header={
            <StudentMainMenu
              evaluationId={evaluationId}
              evaluation={evaluation}
              pages={pages}
              page={page}
            />
          }
        >
          <LayoutSplitScreen
            leftPanel={
              <Stack p={1}>
                <MarkdownViewer
                  id={'evaluation-view-' + evaluationId}
                  readOnly
                  content={evaluation?.conditions}
                />
              </Stack>
            }
            rightPanel={
              evaluationToQuestions?.length > 0 && (
                <Stack p={2}>
                  <Stack
                    spacing={1}
                    direction={'row'}
                    alignItems={'center'}
                    justifyContent={'space-between'}
                    width={'100%'}
                  >
                    <Typography variant="h5">
                      Evaluation is composed of{' '}
                      <b>{evaluationToQuestions.length}</b> questions having a
                      total of{' '}
                      <b>
                        {evaluationToQuestions.reduce(
                          (acc, jtq) => acc + jtq.points,
                          0,
                        )}
                      </b>{' '}
                      pts.
                    </Typography>
                    <ButtonEndEvaliation
                      evaluationId={evaluationId}
                      onEndEvaluation={(ok, message) => {
                        if (ok) {
                          showSnackbar('Evaluation ended', 'success')
                        } else {
                          showSnackbar(message, 'error')
                        }
                        mutate()
                      }}
                    />
                  </Stack>
                  <Stack spacing={1}>
                    <QuestionsGrid
                      evaluationId={evaluationId}
                      evaluationToQuestions={evaluationToQuestions}
                      onSubmit={(questionId) => {
                        submitAnswer(questionId)
                      }}
                    />
                  </Stack>
                </Stack>
              )
            }
            rightWidth={rightPenelWidth(evaluation?.conditions)}
          />
        </LayoutMain>
      </Loading>
    </Authorization>
  )
}

const ButtonEndEvaliation = ({ evaluationId, onEndEvaluation }) => {
  const [loading, setLoading] = useState(false)

  const [endDialogOpen, setEndDialogOpen] = useState(false)

  const handleEndEvaluation = useCallback(async () => {
    setLoading(true)
    const response = await fetch(
      `/api/users/evaluations/${evaluationId}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    const ok = response.ok
    const data = await response.json()
    onEndEvaluation && onEndEvaluation(ok, data.message)

    setLoading(false)
  }, [evaluationId, onEndEvaluation])

  return (
    <Box>
      <LoadingButton
        variant="contained"
        color="primary"
        size="small"
        loading={loading}
        onClick={(ev) => {
          ev.stopPropagation()
          setEndDialogOpen(true)
        }}
      >
        End evaluation
      </LoadingButton>
      {endDialogOpen && (
        <DialogFeedback
          open={true}
          title={'Confirm Evaluation Completion'}
          content={
            <>
              <Typography variant="body1" gutterBottom>
                You are about to end your evaluation.
              </Typography>
              <Typography variant="body2">
                Please ensure that you have completed all necessary sections and
                reviewed your answers. Once you end the evaluation, you will not
                be able to make any further changes.
              </Typography>
              <Typography variant="body2" style={{ marginTop: '8px' }}>
                Are you ready to end your evaluation?
              </Typography>
            </>
          }
          onClose={() => setEndDialogOpen(false)}
          onConfirm={handleEndEvaluation}
        />
      )}
    </Box>
  )
}

const SubmitButton = ({ evaluationId, questionId, answerStatus, onSubmit }) => {
  const [submitLock, setSubmitLock] = useState(false)

  const { showTopCenter: showSnackbar } = useSnackbar()

  const [status, setStatus] = useState(answerStatus)

  useEffect(() => setStatus(answerStatus), [answerStatus])

  const onSubmitClick = useCallback(
    async (questionId) => {
      setSubmitLock(true)
      const response = await fetch(
        `/api/users/evaluations/${evaluationId}/questions/${questionId}/answers/submit`,
        {
          method: 'PUT',
        },
      )
      const ok = response.ok
      if (!ok) {
        setStatus(StudentAnswerStatus.IN_PROGRESS)
        showSnackbar('Cannot submit answer', 'error')
      } else {
        onSubmit && onSubmit()
      }

      setSubmitLock(false)
    },
    [onSubmit, evaluationId, showSnackbar],
  )

  return (
    status !== StudentAnswerStatus.MISSING && (
      <LoadingButton
        key="submit"
        loading={submitLock}
        variant="contained"
        color="primary"
        size="small"
        onClick={(ev) => {
          ev.stopPropagation()
          onSubmitClick(questionId)
        }}
        disabled={status === StudentAnswerStatus.SUBMITTED}
      >
        Submit
      </LoadingButton>
    )
  )
}

const QuestionsGrid = ({ evaluationId, evaluationToQuestions, onSubmit }) => {
  const theme = useTheme()

  const statusMap = {
    [StudentAnswerStatus.SUBMITTED]: {
      color: theme.palette.success.main,
      label: 'submitted',
    },
    [StudentAnswerStatus.IN_PROGRESS]: {
      color: theme.palette.info.main,
      label: 'in progress',
    },
    [StudentAnswerStatus.MISSING]: {
      color: theme.palette.error.main,
      label: 'missing',
    },
  }

  return (
    <DataGrid
      header={{
        actions: {
          label: 'Actions',
          width: '80px',
        },

        columns: [
          {
            label: 'Question',
            column: { flexGrow: 1 },
            renderCell: (row) => {
              return (
                <Stack direction="row" alignItems="center" spacing={1} p={1}>
                  <Typography variant="body1">
                    <b>Q{row.order + 1}</b>
                  </Typography>
                  <QuestionTypeIcon
                    type={row.question.type}
                    withLabel
                    size={32}
                  />
                  <Stack
                    direction={'row'}
                    alignItems={'center'}
                    spacing={1}
                    flexGrow={1}
                    overflow={'hidden'}
                  >
                    <Typography variant="body2">{row.title}</Typography>
                  </Stack>
                </Stack>
              )
            },
          },
          {
            label: 'Points',
            column: { width: '120px' },
            renderCell: (row) => (
              <Chip color="info" label={`${row.points} pts`} />
            ),
          },
          {
            label: 'Status',
            column: { width: '120px' },
            renderCell: (row) => {
              const studentAsnwerStatus = row.question.studentAnswer[0].status

              const statusColor = (status) => statusMap[status].color
              const statusLabel = (status) => statusMap[status].label
              return (
                <Typography
                  variant="body2"
                  color={statusColor(studentAsnwerStatus)}
                >
                  <b>{statusLabel(studentAsnwerStatus)}</b>
                </Typography>
              )
            },
          },
        ],
      }}
      items={evaluationToQuestions.map((jtq) => ({
        ...jtq,
        meta: {
          key: jtq.id,
          linkHref: `/users/evaluations/${evaluationId}/take/${jtq.order + 1}`,
          actions: [
            <SubmitButton
              key="submit"
              evaluationId={evaluationId}
              questionId={jtq.question.id}
              answerStatus={jtq.question.studentAnswer[0].status}
              onSubmit={() => onSubmit(jtq.question.id)}
            />,
          ],
        },
      }))}
    />
  )
}

export default PageEvaluationHome
