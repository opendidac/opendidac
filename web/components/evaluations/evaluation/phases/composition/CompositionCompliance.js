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
import { Alert, AlertTitle, Stack, Typography } from '@mui/material'
import { CodeQuestionType, QuestionType } from '@prisma/client'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'

/**
 * Encapsulates compliance checks and returns banner + per-question indicator.
 */
export const useCompositionCompliance = (composition) => {
  const [hasWarnings, setHasWarnings] = useState(false)
  const [warnings, setWarnings] = useState({})
  const [pointsWarnings, setPointsWarnings] = useState({})
  const [globalWarnings, setGlobalWarnings] = useState([])

  const checkGlobalCompliance = useCallback((evaluationToQuestions) => {
    const list = evaluationToQuestions || []
    const warnings = []
    const totalPoints = list.reduce((sum, eq) => sum + (eq.points || 0), 0)
    if (totalPoints === 0) {
      warnings.push(
        'The total points for all questions is 0. Please set points for at least one question.',
      )
    }
    return warnings
  }, [])

  const codeQuestionComplianceCheck = useCallback((collectionToQuestions) => {
    const list = collectionToQuestions || []
    const warnings = {}
    for (const collectionToQuestion of list) {
      if (collectionToQuestion.question.type === QuestionType.code) {
        const warning =
          'The students may use the code writing code check feature to execute code reading snippets and get the outputs. This can lead to cheating. It is recommended to avoid mixing code reading and code writing questions of the same language in the same collection.'

        const codeType = collectionToQuestion.question.code.codeType
        const language = collectionToQuestion.question.code.language
        const oppositeCodeType =
          codeType === CodeQuestionType.codeWriting
            ? CodeQuestionType.codeReading
            : CodeQuestionType.codeWriting

        const oppositeCodeQuestion = list.filter(
          (item) =>
            item.question.type === 'code' &&
            item.question.code.codeType === oppositeCodeType &&
            item.question.code.language === language,
        )

        if (oppositeCodeQuestion.length > 0) {
          warnings[collectionToQuestion.question.id] = warning
          for (const oppositeQuestion of oppositeCodeQuestion) {
            warnings[oppositeQuestion.question.id] = warning
          }
        }
      }
    }
    return warnings
  }, [])

  const pointsComplianceCheck = useCallback((evaluationToQuestions) => {
    const list = evaluationToQuestions || []
    const warnings = {}
    list.forEach((eq) => {
      if (!eq.points || eq.points === 0) {
        warnings[eq.question.id] =
          'This question has no points assigned. Please set a value greater than 0.'
      }
    })
    return warnings
  }, [])

  const complianceCheck = useCallback(
    (evaluationToQuestions) => {
      const list = evaluationToQuestions || []
      const warnings = {}
      for (const eq of list) {
        switch (eq.question.type) {
          case QuestionType.code:
            Object.assign(warnings, codeQuestionComplianceCheck(list))
            break
          default:
            break
        }
      }
      return warnings
    },
    [codeQuestionComplianceCheck],
  )

  useEffect(() => {
    const newWarnings = complianceCheck(composition)
    const newPointsWarnings = pointsComplianceCheck(composition)
    const newGlobalWarnings = checkGlobalCompliance(composition)

    setWarnings(newWarnings)
    setPointsWarnings(newPointsWarnings)
    setGlobalWarnings(newGlobalWarnings)
    setHasWarnings(
      Object.keys(newWarnings).length > 0 ||
        Object.keys(newPointsWarnings).length > 0 ||
        newGlobalWarnings.length > 0,
    )
  }, [
    composition,
    complianceCheck,
    pointsComplianceCheck,
    checkGlobalCompliance,
  ])

  const getIndicator = useCallback(
    (questionId) => {
      const questionWarnings = []
      if (warnings[questionId]) questionWarnings.push(warnings[questionId])
      if (pointsWarnings[questionId])
        questionWarnings.push(pointsWarnings[questionId])
      if (questionWarnings.length > 0) {
        return (
          <Stack direction="row" spacing={0}>
            {questionWarnings.map((warning, index) => (
              <UserHelpPopper key={index} mode={'warning'}>
                {warning}
              </UserHelpPopper>
            ))}
          </Stack>
        )
      }
      return null
    },
    [warnings, pointsWarnings],
  )

  return { hasWarnings, globalWarnings, getIndicator }
}

export const ComplianceBanner = ({ hasWarnings, globalWarnings }) => {
  if (!hasWarnings) return null
  return (
    <Alert severity="warning" sx={{ mb: 1 }}>
      <AlertTitle>Compliance warnings</AlertTitle>
      <Stack spacing={1}>
        <Typography variant="body2">
          Click on the warning icon next to the questions to see details.
        </Typography>
        {globalWarnings.map((warning, index) => (
          <Typography key={index} variant="body2">
            {warning}
          </Typography>
        ))}
        <Typography variant="body1">
          These warnings can be ignored. You may proceed if you have carefully
          considered the implications.
        </Typography>
      </Stack>
    </Alert>
  )
}

export default ComplianceBanner
