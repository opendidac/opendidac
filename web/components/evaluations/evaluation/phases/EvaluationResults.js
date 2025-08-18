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
import { Button, IconButton, Stack, Tooltip } from '@mui/material'
import EvaluationTitleBar from '../layout/EvaluationTitleBar'
import ExportCSV from './results/ExportCSV'
import StudentResultsGrid from './results/StudentResultsGrid'
import ExportPdfButton from './results/ExportPdfButton'
import NextImage from 'next/image'
import { useRouter } from 'next/router'

const EvaluationResults = ({ groupScope, evaluation, attendance, results }) => {
  const router = useRouter()

  const evaluationId = evaluation.id

  return (
    <Stack flex={1} px={1}>
      <EvaluationTitleBar
        title="Evaluation Results"
        action={
          <Stack direction="row" spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ExportCSV
                evaluation={evaluation}
                results={results}
                attendance={attendance}
              />
              <ExportPdfButton
                groupScope={groupScope}
                evaluationId={evaluationId}
              />
              <Button
                variant="text"
                color="primary"
                onClick={() =>
                  router.push(
                    `/${groupScope}/evaluations/${evaluationId}/grading/1`,
                  )
                }
              >
                Open grading tool
              </Button>
            </Stack>
          </Stack>
        }
      />

      <StudentResultsGrid
        attendance={attendance}
        results={results}
        actions={(row) => {
          return (
            <Tooltip title="View student's answers" key="view-student-answers">
              <a
                href={`/${groupScope}/evaluations/${evaluationId}/consult/${row.participant.email}/1`}
                target="_blank"
              >
                <IconButton size="small">
                  <NextImage
                    alt="View"
                    src="/svg/icons/view-user.svg"
                    width="18"
                    height="18"
                  />
                </IconButton>
              </a>
            </Tooltip>
          )
        }}
        questionCellClick={async (questionId, participantId) => {
          const questionOrder =
            results.find((jstq) => jstq.question.id === questionId).order + 1
          const participantEmail = attendance.registered.find(
            (r) => r.user.id === participantId,
          ).user.email
          await router.push(
            `/${groupScope}/evaluations/${evaluationId}/consult/${participantEmail}/${questionOrder}`,
          )
        }}
      />
    </Stack>
  )
}

export default EvaluationResults
