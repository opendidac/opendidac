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
import {
  Autocomplete,
  FormControlLabel,
  FormGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Role, EvaluationPhase } from '@prisma/client'

import { fetcher } from '@/code/utils'

import BackButton from '@/components/layout/BackButton'
import LayoutMain from '@/components/layout/LayoutMain'
import Authorization from '@/components/security/Authorization'
import Loading from '@/components/feedback/Loading'

import EvaluationAnalytics from '../analytics/EvaluationAnalytics'

const PageAnalytics = () => {
  const router = useRouter()
  const { groupScope, evaluationId } = router.query

  const { data: evaluations, error: errorEvaluations } = useSWR(
    `/api/${groupScope}/evaluations`,
    groupScope && evaluationId ? fetcher : null,
  )

  const { data: evaluation, error: errorEvaluation } = useSWR(
    `/api/${groupScope}/evaluations/${evaluationId}`,
    groupScope && evaluationId ? fetcher : null,
  )

  const { data: evaluationToQuestions, error: errorQuestions } = useSWR(
    `/api/${groupScope}/evaluations/${evaluationId}/questions?withGradings=true`,
    groupScope && evaluationId ? fetcher : null,
    { refreshInterval: 1000 },
  )

  const [showSuccessRate, setShowSuccessRate] = useState(false)

  const [value, setValue] = useState(null)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (evaluation) {
      setValue(evaluation)
      setInputValue(evaluation.label)
      setShowSuccessRate(evaluation.phase === EvaluationPhase.FINISHED)
    }
  }, [evaluation])

  return (
    <Authorization allowRoles={[Role.PROFESSOR]}>
      <Loading
        error={[errorEvaluations, errorEvaluation, errorQuestions]}
        loading={!evaluation || !evaluations || !evaluationToQuestions}
      >
        <LayoutMain
          header={
            <Stack direction="row" alignItems="center">
              <BackButton backUrl={`/${groupScope}/evaluations`} />
              {evaluation?.id && (
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  {evaluation.label}
                </Typography>
              )}
            </Stack>
          }
          padding={2}
          spacing={2}
        >
          {evaluation && evaluations && evaluationToQuestions && (
            <Stack alignItems="center" spacing={2} padding={2}>
              <Autocomplete
                id="chose-evaluation"
                options={evaluations}
                getOptionLabel={(option) => option.label}
                sx={{ width: '70%' }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="evaluation"
                    variant="outlined"
                  />
                )}
                value={value}
                onChange={async (event, newValue) => {
                  if (newValue && newValue.id) {
                    await router.push(
                      `/${groupScope}/evaluations/${newValue.id}/analytics`,
                    )
                  }
                }}
                inputValue={inputValue}
                onInputChange={(event, newInputValue) => {
                  setInputValue(newInputValue)
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showSuccessRate}
                      onChange={(event) =>
                        setShowSuccessRate(event.target.checked)
                      }
                    />
                  }
                  label="Show success rate"
                />
              </FormGroup>
              <EvaluationAnalytics
                showSuccessRate={showSuccessRate}
                evaluationToQuestions={evaluationToQuestions}
              />
            </Stack>
          )}
        </LayoutMain>
      </Loading>
    </Authorization>
  )
}

export default PageAnalytics
