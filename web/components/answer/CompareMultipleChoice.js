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
import { Alert, Box, Stack, TextField, Typography } from '@mui/material'
import RadioViewer from '@/components/input/RadioViewer'
import ResizePanel from '@/components/layout/utils/ResizePanel'
import ScrollContainer from '../layout/ScrollContainer'
import { useMemo } from 'react'
import MultipleChoiceConfig from './multipleChoice/MultipleChoiceConfig'
import GradingPolicyBreakdown from '../evaluations/grading/policy/GradingPolicyBreakdown'
import MarkdownViewer from '@/components/input/markdown/MarkdownViewer'
import { useTheme } from '@emotion/react'

const StudentSelectionSummary = ({ solution, answer }) => {
  const missedCorrect = solution.options.filter(
    (option) =>
      option.isCorrect && !answer.options.some((opt) => opt.id === option.id),
  ).length
  const incorrectSelection = solution.options.filter(
    (option) =>
      !option.isCorrect && answer.options.some((opt) => opt.id === option.id),
  ).length
  const correctSelection = solution.options.filter(
    (option) =>
      option.isCorrect && answer.options.some((opt) => opt.id === option.id),
  ).length

  return (
    <Stack spacing={2} direction={'row'} width={'100%'}>
      {correctSelection > 0 && (
        <Alert severity="success">{correctSelection} correct</Alert>
      )}
      {missedCorrect > 0 && (
        <Alert severity="error">{missedCorrect} missed</Alert>
      )}
      {incorrectSelection > 0 && (
        <Alert severity="error">{incorrectSelection} incorrect</Alert>
      )}
      {missedCorrect === 0 && incorrectSelection === 0 && (
        <Alert severity="success">No incorrect or missed</Alert>
      )}
    </Stack>
  )
}

const CompareMultipleChoice = ({
  readOnly = false,
  maxPoints,
  question,
  solution,
  answer,
}) => {
  const radio = useMemo(() => {
    return solution.activateSelectionLimit && solution.selectionLimit === 1
  }, [solution.activateSelectionLimit, solution.selectionLimit])

  return (
    <Stack p={2} pt={2} height={'100%'} spacing={2}>
      <Stack direction={'row'} alignItems={'center'} spacing={1}>
        <StudentSelectionSummary solution={solution} answer={answer} />
        {!readOnly && (
          <GradingPolicyBreakdown
            questionType={question.type}
            gradingPolicy={question[question.type].gradingPolicy}
            maxPoints={maxPoints}
            solution={solution}
            question={question}
            answer={answer}
          />
        )}
      </Stack>
      <MultipleChoiceConfig multipleChoice={solution} />
      <Stack flex={1}>
        <ScrollContainer>
          <Box>
            <ResizePanel
              leftPanel={
                <Stack spacing={1}>
                  <Typography variant="h6">Student&apos;s options</Typography>
                  {solution.options?.map((option, index) => (
                    <MultipleChoiceOptionSelect
                      key={index}
                      option={option}
                      round={radio}
                      isFilled={answer.options.some(
                        (opt) => opt.id === option.id,
                      )}
                      onSelect={() => {}}
                    />
                  ))}
                  {solution.activateStudentComment && (
                    <TextField
                      label={solution.studentCommentLabel || 'Comment'}
                      multiline
                      variant="standard"
                      fullWidth
                      value={answer.comment || ''}
                    />
                  )}
                </Stack>
              }
              rightPanel={
                <Stack spacing={1}>
                  <Typography variant="h6">Solution options</Typography>
                  {solution.options?.map((option, index) => (
                    <MultipleChoiceOptionSelect
                      key={index}
                      option={option}
                      round={radio}
                      isCorrect={option.isCorrect}
                      isFilled={option.isCorrect}
                    />
                  ))}
                </Stack>
              }
            />
          </Box>
        </ScrollContainer>
      </Stack>
    </Stack>
  )
}

const MultipleChoiceOptionSelect = ({
  round = false,
  option,
  isFilled,
  isCorrect,
}) => {
  const theme = useTheme()

  return (
    <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ flex: 1 }}>
      <RadioViewer
        mode={'compare'}
        round={round}
        isCorrect={isCorrect}
        isFilled={isFilled}
      />

      <Stack flex={1} bgcolor={theme.palette.background.paper}>
        <MarkdownViewer
          content={option.text}
          bgColor={theme.palette.background.paper}
        />
      </Stack>
    </Stack>
  )
}

export default CompareMultipleChoice
