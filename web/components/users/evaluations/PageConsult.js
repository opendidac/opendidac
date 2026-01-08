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
import { Role, StudentAnswerStatus } from '@prisma/client'
import Authorization from '../../security/Authorization'
import LayoutSplitScreen from '../../layout/LayoutSplitScreen'
import { Box, Paper, Stack, Typography, Button, Alert } from '@mui/material'
import Paging from '../../layout/utils/Paging'
import { useEffect, useMemo, useState } from 'react'
import StudentPhaseRedirect from './StudentPhaseRedirect'
import QuestionView from '../../question/QuestionView'
import GradingSigned from '../../evaluations/grading/GradingSigned'
import GradingPointsComment from '../../evaluations/grading/GradingPointsComment'
import LayoutMain from '../../layout/LayoutMain'
import AnswerConsult from '../../answer/AnswerConsult'
import Loading from '../../feedback/Loading'
import { fetcher } from '../../../core/utils'
import AnswerCompare from '@/components/answer/AnswerCompare'
import Overlay from '@/components/ui/Overlay'
import AlertFeedback from '@/components/feedback/AlertFeedback'
import Addendum from '@/components/evaluations/addendum/Addendum'
import NextImage from 'next/image'

const getFilledStatus = (studentAnswerStatus) => {
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

const PageConsult = () => {
  const router = useRouter()
  const { evaluationId, questionPage } = router.query

  // Fetch evaluation status and user evaluation data
  const { data: evaluationStatus, error: errorEvaluationStatus } = useSWR(
    `/api/users/evaluations/${evaluationId}/status`,
    evaluationId ? fetcher : null,
    { refreshInterval: 1000 },
  )

  const { data: userOnEvaluation, error: errorUserOnEvaluation } = useSWR(
    `/api/users/evaluations/${evaluationId}/consult`,
    evaluationId ? fetcher : null,
    {
      revalidateOnFocus: false,
      onError: (err) => {
        if (err.status === 403) {
          setConsultationDisabled(true)
        }
      },
    },
  )

  const [evaluationToQuestions, setEvaluationToQuestions] = useState([])
  const [selected, setSelected] = useState()
  const [consultationDisabled, setConsultationDisabled] = useState(false)

  // Inline PDF Export Button

  useEffect(() => {
    if (
      userOnEvaluation &&
      userOnEvaluation.evaluationToQuestions &&
      userOnEvaluation.evaluationToQuestions.length > 0
    ) {
      setEvaluationToQuestions(userOnEvaluation.evaluationToQuestions)
      setSelected(userOnEvaluation.evaluationToQuestions[questionPage - 1])
    }
  }, [userOnEvaluation, questionPage])

  useEffect(() => {
    if (evaluationToQuestions && evaluationToQuestions.length > 0) {
      setSelected(evaluationToQuestions[questionPage - 1])
    }
  }, [questionPage, evaluationToQuestions])

  const questionPages = useMemo(
    () =>
      evaluationToQuestions.map((jstq) => ({
        id: jstq.question.id,
        label: `Q${jstq.order + 1}`,
        fillable: true,
        tooltip: `${jstq.title} - ${jstq.points} points`,
        state: getFilledStatus(jstq.question.studentAnswer[0].status),
      })),
    [evaluationToQuestions],
  )

  // If consultation is disabled, show the dialog
  if (consultationDisabled) {
    return <ConsultationDisabledDialog />
  }

  if (!userOnEvaluation && errorUserOnEvaluation) {
    if (errorUserOnEvaluation.id === 'evaluation-purged') {
      return <NoLongerAvailableDialog />
    }
  }

  return (
    <Authorization allowRoles={[Role.PROFESSOR, Role.STUDENT]}>
      <Loading loading={!evaluationStatus} errors={[errorEvaluationStatus]}>
        {evaluationStatus && (
          <StudentPhaseRedirect phase={evaluationStatus.evaluation.phase}>
            <Loading
              loading={!userOnEvaluation}
              error={[errorUserOnEvaluation]}
            >
              {evaluationToQuestions && selected && (
                <LayoutMain
                  header={
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Stack flex={1} sx={{ overflow: 'hidden' }}>
                        <Paging
                          items={questionPages}
                          active={selected.question}
                          link={(_, questionIndex) =>
                            `/users/evaluations/${evaluationId}/consult/${
                              questionIndex + 1
                            }`
                          }
                        />
                      </Stack>
                    </Stack>
                  }
                  subheader={
                    <Alert
                      severity="info"
                      action={
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            window.open(
                              `/api/users/evaluations/${evaluationId}/export`,
                              '_blank',
                            )
                          }
                          startIcon={
                            <NextImage
                              alt="Download PDF"
                              src="/svg/icons/file-pdf.svg"
                              width="16"
                              height="16"
                            />
                          }
                        >
                          Download PDF
                        </Button>
                      }
                    >
                      This consultation will remain accessible until the
                      evaluation is archived.
                    </Alert>
                  }
                >
                  <LayoutSplitScreen
                    sx={{ flex: 1 }}
                    leftPanel={
                      selected && (
                        <QuestionView
                          title={
                            <Typography variant="h6">
                              {selected.title}
                            </Typography>
                          }
                          order={selected.order}
                          points={selected.points}
                          question={selected.question}
                          totalPages={evaluationToQuestions.length}
                          above={
                            <Addendum
                              evaluationToQuestion={selected}
                              readOnly={true}
                            />
                          }
                        />
                      )
                    }
                    rightWidth={65}
                    rightPanel={
                      selected &&
                      (userOnEvaluation.showSolutionsWhenFinished ? (
                        <Box height={'100%'}>
                          <AnswerCompare
                            id={`answer-viewer-${selected.question.id}`}
                            readOnly
                            evaluationToQuestion={selected}
                            solution={selected.question[selected.question.type]}
                            answer={
                              selected.question.studentAnswer[0][
                                selected.question.type
                              ]
                            }
                          />
                        </Box>
                      ) : (
                        <AnswerConsult
                          id={`answer-viewer-${selected.question.id}`}
                          question={selected.question}
                          answer={
                            selected.question.studentAnswer[0][
                              selected.question.type
                            ]
                          }
                        />
                      ))
                    }
                    footer={
                      <>
                        {selected &&
                          selected.question.studentAnswer[0].studentGrading
                            .signedBy && (
                            <Paper sx={{ height: '80px' }} square>
                              <Stack
                                spacing={2}
                                direction="row"
                                justifyContent="center"
                                alignItems="center"
                                height="100%"
                                pr={1}
                              >
                                <GradingSigned
                                  signedBy={
                                    selected.question.studentAnswer[0]
                                      .studentGrading.signedBy
                                  }
                                  readOnly={true}
                                />
                                <GradingPointsComment
                                  points={
                                    selected.question.studentAnswer[0]
                                      .studentGrading.pointsObtained
                                  }
                                  maxPoints={selected.points}
                                  comment={
                                    selected.question.studentAnswer[0]
                                      .studentGrading.comment
                                  }
                                />
                              </Stack>
                            </Paper>
                          )}
                      </>
                    }
                  />
                </LayoutMain>
              )}
            </Loading>
          </StudentPhaseRedirect>
        )}
      </Loading>
    </Authorization>
  )
}

const ConsultationDisabledDialog = () => (
  <Overlay>
    <AlertFeedback severity="info">
      <Stack spacing={1}>
        <Typography variant="h5">Consultation is disabled</Typography>
        <Typography variant="body1">
          Consultation for this evaluation is disabled. You cannot view the
          results or feedback.
        </Typography>
        <Typography variant="body1">
          If you have any questions regarding the consultation, please contact
          your professor for further information.
        </Typography>
      </Stack>
    </AlertFeedback>
  </Overlay>
)

const NoLongerAvailableDialog = () => (
  <Overlay>
    <AlertFeedback severity="info">
      <Stack spacing={1}>
        <Typography variant="h5">
          Evaluation is no longer available for consultation
        </Typography>
      </Stack>
    </AlertFeedback>
  </Overlay>
)

export default PageConsult
