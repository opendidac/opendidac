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
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { StudentQuestionGradingStatus } from '@prisma/client'
import Image from 'next/image'
import {
  Chip,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useSession } from 'next-auth/react'

import DecimalInput from '@/components/input/DecimalInput'

import GradingStatus from './GradingStatus'
import GradingSigned from './GradingSigned'
import GradingPointsComment from './GradingPointsComment'

const GradingSignOff = ({
  loading,
  answer: initial,
  maxPoints,
  weightedPoints: weightedMaxPoints,
  onChange,
}) => {
  const [grading, setGrading] = useState(initial)
  const { data } = useSession()
  const commentInputRef = useRef(null)

  useEffect(() => {
    setGrading(initial.studentGrading)
  }, [initial])

  const signOffGrading = useCallback(() => {
    const newGrading = {
      ...grading,
      isCorrect: grading.pointsObtained === maxPoints,
      status:
        grading.status === StudentQuestionGradingStatus.UNGRADED
          ? StudentQuestionGradingStatus.GRADED
          : grading.status,
      signedBy: data.user,
    }
    setGrading(newGrading)
    onChange(newGrading)
  }, [grading, maxPoints, onChange, data])

  const unsignGrading = useCallback(() => {
    let newGrading = {
      ...grading,
      status:
        grading.status === StudentQuestionGradingStatus.GRADED
          ? StudentQuestionGradingStatus.UNGRADED
          : grading.status,
      signedBy: undefined,
    }
    setGrading(newGrading)
    onChange(newGrading)
  }, [grading, onChange])

  const handleKeyDown = useCallback(
    (event) => {
      // Support both Ctrl and Command (Meta) key
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        // Prevent event from bubbling up
        event.preventDefault()
        event.stopPropagation()

        // If CTRL/CMD+Enter is pressed, either sign off or unsign
        if (grading.signedBy) {
          unsignGrading()
        } else {
          signOffGrading()
        }
      }
    },
    [signOffGrading, unsignGrading, grading.signedBy],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  const coef = useMemo(() => {
    return maxPoints > 0 ? weightedMaxPoints / maxPoints : 0
  }, [maxPoints, weightedMaxPoints])

  const roundedCoef = useMemo(() => {
    return Math.round(coef * 100) / 100
  }, [coef])

  const roundedWeightedMaxPoints = useMemo(() => {
    return Math.round(grading.pointsObtained * coef * 100) / 100
  }, [grading.pointsObtained, coef])

  return (
    <Paper
      sx={{
        flex: 1,
      }}
      square
    >
      {grading && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ height: '100%', p: 2 }}
          spacing={8}
        >
          <Stack direction="row">
            {grading.signedBy ? (
              <GradingSigned
                signedBy={grading.signedBy}
                onUnsign={unsignGrading}
              />
            ) : (
              <Tooltip
                title={`${navigator.userAgent.includes('Mac') ? '⌘' : 'CTRL'}+Enter`}
              >
                <LoadingButton
                  color="success"
                  variant="contained"
                  loading={loading}
                  loadingPosition="start"
                  startIcon={
                    <Image
                      src="/svg/grading/sign-off.svg"
                      alt="Sign Off"
                      width={16}
                      height={16}
                    />
                  }
                  onClick={signOffGrading}
                >
                  Sign Off
                </LoadingButton>
              </Tooltip>
            )}
          </Stack>

          {!grading.signedBy && (
            <Stack direction="row" alignItems="center" spacing={2} flexGrow={1}>
              <Stack direction={'row'} alignItems={'center'} spacing={1}>
                <DecimalInput
                  autoFocus
                  label={'Awarded Points'}
                  value={grading.pointsObtained}
                  max={maxPoints}
                  rightAdornement={'/ ' + maxPoints + ' pts'}
                  variant="filled"
                  onChange={async (value) => {
                    const newGrading = {
                      ...grading,
                      pointsObtained: value,
                      status: StudentQuestionGradingStatus.GRADED,
                    }
                    setGrading(newGrading)
                    onChange(newGrading)
                  }}
                />
                {maxPoints !== weightedMaxPoints && (
                  <>
                    <Typography variant={'body2'} sx={{ textWrap: 'nowrap' }}>
                      &times; {roundedCoef} =
                    </Typography>
                    <Chip
                      variant="outlined"
                      label={
                        <>
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{ mr: 1 }}
                          >
                            <b>{roundedWeightedMaxPoints}</b>
                          </Typography>
                          <Typography variant="caption" component="span">
                            / {weightedMaxPoints} pts
                          </Typography>
                        </>
                      }
                    ></Chip>
                  </>
                )}
              </Stack>
              <TextField
                ref={commentInputRef}
                label="Comment"
                fullWidth
                multiline
                maxRows={3}
                variant="filled"
                value={grading.comment || ''}
                onChange={(event) => {
                  let newGrading = {
                    ...grading,
                    comment: event.target.value,
                  }
                  setGrading(newGrading)
                  onChange(newGrading)
                }}
              />
            </Stack>
          )}

          {grading.signedBy && (
            <GradingPointsComment
              points={coef * grading.pointsObtained}
              maxPoints={roundedWeightedMaxPoints}
              comment={grading.comment}
            />
          )}

          <GradingStatus grading={grading} maxPoints={maxPoints} />
        </Stack>
      )}
    </Paper>
  )
}

export default GradingSignOff
