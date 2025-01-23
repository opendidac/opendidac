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
  Box,
  Divider,
  Grow,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { getQuestionSuccessRate, typeSpecificStats } from './stats'
import {
  CodeQuestionType,
  QuestionType,
  StudentAnswerStatus,
} from '@prisma/client'

import PiePercent from '@/components/feedback/PiePercent'
import QuestionTypeIcon from '@/components/question/QuestionTypeIcon'
import FilledBullet from '@/components/feedback/FilledBullet'
import ConsoleLog from '@/components/layout/utils/ConsoleLog'

const EvaluationAnalytics = ({
  evaluationToQuestions,
  showSuccessRate = false,
}) => {
  return (
    <Stack spacing={8} alignItems="center" sx={{ width: '100%' }}>
      {evaluationToQuestions.map((jstq, index) => (
        <QuestionAnalytics
          key={index}
          evaluationToQuestions={jstq}
          showSuccessRate={showSuccessRate}
        />
      ))}
    </Stack>
  )
}

const questionTypeToLegend = {
  [QuestionType.multipleChoice]: [
    { color: 'success', tooltip: 'Correct option chosen by students' },
    { color: 'error', tooltip: 'Incorrect option chosen by students' },
  ],
  [QuestionType.trueFalse]: [
    { color: 'success', tooltip: 'Correct answer chosen by students' },
    { color: 'error', tooltip: 'Incorrect answer chosen by students' },
  ],
  [QuestionType.code]: {
    [CodeQuestionType.codeWriting]: [
      { color: 'success', tooltip: 'All test cases passed' },
      { color: 'error', tooltip: 'Not all test cases passed' },
      { color: 'info', tooltip: 'No code check runs' },
    ],
    [CodeQuestionType.codeReading]: [
      { color: 'success', tooltip: 'All outputs match' },
      { color: 'error', tooltip: 'Not all outputs match' },
      { color: 'info', tooltip: 'Not answered' },
    ],
  },
  [QuestionType.essay]: [{ color: 'success', tooltip: 'Submitted answers' }],
  [QuestionType.web]: [{ color: 'success', tooltip: 'Submitted answers' }],
  [QuestionType.database]: [
    { color: 'success', tooltip: 'Test passed' },
    { color: 'error', tooltip: 'Test failed' },
  ],
}

const QuestionAnalytics = ({ evaluationToQuestions, showSuccessRate }) => {
  const { question } = evaluationToQuestions

  // student answer will correspond to the total number of students
  let maxValue = question.studentAnswer.length

  const [questionData, setQuestionData] = useState(null)

  useEffect(() => {
    if (evaluationToQuestions) {
      let data = {
        label: `Q${evaluationToQuestions.order + 1}`,
        type: question.type,
        [question.type]: typeSpecificStats(question),
      }
      switch (question.type) {
        case QuestionType.multipleChoice: {
          data[question.type] = data[question.type].map((option) => ({
            ...option,
            percentage:
              maxValue > 0 ? Math.round((option.chosen / maxValue) * 100) : 0,
            color: option.isCorrect ? 'success' : 'error',
          }))
          break
        }
        case QuestionType.trueFalse: {
          data[question.type].true.percentage =
            maxValue > 0
              ? Math.round((data[question.type].true.chosen / maxValue) * 100)
              : 0
          data[question.type].false.percentage =
            maxValue > 0
              ? Math.round((data[question.type].false.chosen / maxValue) * 100)
              : 0

          // Assign colors to true/false based on correctness
          data[question.type].true.color = data[question.type].true.isTrue
            ? 'success'
            : 'error'
          data[question.type].false.color = data[question.type].false.isTrue
            ? 'success'
            : 'error'
          break
        }
        case QuestionType.code: {
          const codeType = question.code.codeType
          data[question.type].codeType = codeType

          data[question.type].success.percentage =
            maxValue > 0
              ? Math.round((data[question.type].success.count / maxValue) * 100)
              : 0
          data[question.type].failure.percentage =
            maxValue > 0
              ? Math.round((data[question.type].failure.count / maxValue) * 100)
              : 0

          switch (codeType) {
            case CodeQuestionType.codeWriting:
              {
                data[question.type].noCodeCheckRuns.percentage =
                  maxValue > 0
                    ? Math.round(
                        (data[question.type].noCodeCheckRuns.count / maxValue) *
                          100,
                      )
                    : 0
              }
              break
            case CodeQuestionType.codeReading:
              {
                data[question.type].unanswered.percentage =
                  maxValue > 0
                    ? Math.round(
                        (data[question.type].unanswered.count / maxValue) * 100,
                      )
                    : 0
              }
              break
          }

          break
        }
        case QuestionType.essay:
        case QuestionType.web: {
          data[question.type].submitted.percentage =
            maxValue > 0
              ? Math.round(
                  (data[question.type].submitted.count / maxValue) * 100,
                )
              : 0
          data[question.type].missing.percentage =
            maxValue > 0
              ? Math.round((data[question.type].missing.count / maxValue) * 100)
              : 0
          break
        }
        case QuestionType.database:
          data[question.type].testQueriesStats = data[
            question.type
          ].testQueriesStats.map((testQueryStats) => {
            const testSuccesses = testQueryStats.testSuccesses
            const testFailures = testQueryStats.testFailures
            return {
              label: `Test Query #${testQueryStats.order} - ${testQueryStats.title}`,
              success: {
                label: 'Success',
                percent:
                  testSuccesses + testFailures > 0
                    ? Math.round(
                        (testSuccesses / (testSuccesses + testFailures)) * 100,
                      )
                    : 0,
                amount: testSuccesses,
              },
              failure: {
                label: 'Failure',
                percent:
                  testSuccesses + testFailures > 0
                    ? Math.round(
                        (testFailures / (testSuccesses + testFailures)) * 100,
                      )
                    : 0,
                amount: testFailures,
              },
            }
          })

          data[question.type].lintQueriesStats = data[
            question.type
          ].lintQueriesStats.map((lintQueryStats) => {
            const lintSuccesses = lintQueryStats.lintSuccesses
            const lintFailures = lintQueryStats.lintFailures
            return {
              label: `Lint Query #${lintQueryStats.order} - ${lintQueryStats.title}`,
              success: {
                label: 'Success',
                percent:
                  lintSuccesses + lintFailures > 0
                    ? Math.round(
                        (lintSuccesses / (lintSuccesses + lintFailures)) * 100,
                      )
                    : 0,
                amount: lintSuccesses,
              },
              failure: {
                label: 'Failure',
                percent:
                  lintSuccesses + lintFailures > 0
                    ? Math.round(
                        (lintFailures / (lintSuccesses + lintFailures)) * 100,
                      )
                    : 0,
                amount: lintFailures,
              },
            }
          })

          break
        default:
          break
      }
      setQuestionData(data)
    }
  }, [question, evaluationToQuestions, maxValue])

  const getLegend = (type, codeType) => {
    if (type === QuestionType.code) {
      return questionTypeToLegend[type][codeType]
    }
    return questionTypeToLegend[type]
  }

  const submittedAnswers = question.studentAnswer.filter(
    (sa) => sa.status !== StudentAnswerStatus.MISSING,
  ).length
  const totalAnswers = question.studentAnswer.length

  return (
    <Paper sx={{ p: 2, width: '100%' }}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent={'space-between'}
          spacing={1}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <QuestionTypeIcon type={question.type} withLabel />
            <Typography variant="h6">
              <b>{`Q${evaluationToQuestions.order + 1}`}</b>
            </Typography>
            <Typography variant="body1">{question.title}</Typography>
          </Stack>
          <ColorLegend
            items={getLegend(question.type, question.code?.codeType)}
          />
        </Stack>
        {questionData &&
          ((questionData.type === QuestionType.multipleChoice && (
            <Stack direction="column" alignItems="flex-start" spacing={1}>
              {questionData[questionData.type].map((option, index) => (
                <AnalyticsRow
                  key={index}
                  label={
                    <Tooltip
                      title={option.tooltip}
                      key={index}
                      placement="right"
                    >
                      <Typography variant="body1">
                        <b>{option.label}</b>
                      </Typography>
                    </Tooltip>
                  }
                  segments={[
                    {
                      percent: option.percentage,
                      color: option.color,
                      tooltip: `${option.text} [${option.chosen}]`,
                    },
                  ]}
                  amount={option.chosen}
                />
              ))}
            </Stack>
          )) ||
            (questionData.type === QuestionType.trueFalse && (
              <>
                <AnalyticsRow
                  label={<b>True</b>}
                  segments={[
                    {
                      percent: questionData[questionData.type].true.percentage,
                      color: questionData[questionData.type].true.color,
                      tooltip: 'Students chose true',
                    },
                  ]}
                  amount={questionData[questionData.type].true.chosen}
                />
                <AnalyticsRow
                  label={<b>False</b>}
                  segments={[
                    {
                      percent: questionData[questionData.type].false.percentage,
                      color: questionData[questionData.type].false.color,
                      tooltip: 'Students chose false',
                    },
                  ]}
                  amount={questionData[questionData.type].false.chosen}
                />
              </>
            )) ||
            (questionData.type === QuestionType.code && (
              <>
                <ConsoleLog data={questionData[questionData.type]} />
                {questionData[questionData.type].codeType ===
                  CodeQuestionType.codeWriting && (
                  <AnalyticsRow
                    label={
                      <Tooltip title="For the last code check run, all test cases passed">
                        <Typography variant="body1">
                          <b>Success</b>
                        </Typography>
                      </Tooltip>
                    }
                    color="success"
                    segments={[
                      {
                        percent:
                          questionData[questionData.type].success.percentage,
                        color: 'success',
                        tooltip: `All test cases passed [${
                          questionData[questionData.type].success.count
                        }]`,
                      },
                      {
                        percent:
                          questionData[questionData.type].failure.percentage,
                        color: 'error',
                        tooltip: `Not all test cases passed [${
                          questionData[questionData.type].failure.count
                        }]`,
                      },
                      {
                        percent:
                          questionData[questionData.type].noCodeCheckRuns
                            .percentage,
                        color: 'info',
                        tooltip: `No code check runs [${
                          questionData[questionData.type].noCodeCheckRuns.count
                        }]`,
                      },
                    ]}
                    amount={submittedAnswers}
                  />
                )}
                {questionData[questionData.type].codeType ===
                  CodeQuestionType.codeReading && (
                  <AnalyticsRow
                    label={
                      <Tooltip title="For the last code check run, all outputs match">
                        <Typography variant="body1">
                          <b>Success</b>
                        </Typography>
                      </Tooltip>
                    }
                    color="success"
                    segments={[
                      {
                        percent:
                          questionData[questionData.type].success.percentage,
                        color: 'success',
                        tooltip: `All outputs match [${
                          questionData[questionData.type].success.count
                        }]`,
                      },
                      {
                        percent:
                          questionData[questionData.type].failure.percentage,
                        color: 'error',
                        tooltip: `Not all outputs match [${
                          questionData[questionData.type].failure.count
                        }]`,
                      },
                      {
                        percent:
                          questionData[questionData.type].unanswered.percentage,
                        color: 'info',
                        tooltip: `Not answered [${
                          questionData[questionData.type].unanswered.count
                        }]`,
                      },
                    ]}
                    amount={submittedAnswers}
                  />
                )}
              </>
            )) ||
            ((questionData.type === QuestionType.essay ||
              questionData.type === QuestionType.web) && (
              <>
                <AnalyticsRow
                  label="Submitted"
                  color="success"
                  segments={[
                    {
                      percent:
                        questionData[questionData.type].submitted.percentage,
                      color: 'success',
                      tooltip: 'Submitted answers',
                    },
                  ]}
                  amount={questionData[questionData.type].submitted.count}
                />
              </>
            )) ||
            (questionData.type === QuestionType.database && (
              <>
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  spacing={2}
                  width={'100%'}
                >
                  <Stack flex={1} spacing={1}>
                    <Typography variant="h5"> Output tests </Typography>
                    {questionData[questionData.type].testQueriesStats.map(
                      (testQueryStats, index) => (
                        <Stack
                          key={index}
                          direction="column"
                          alignItems="flex-start"
                          spacing={1}
                        >
                          <Typography variant="body1">
                            <b>{testQueryStats.label}</b>
                          </Typography>
                          <AnalyticsRow
                            label={testQueryStats.success.label}
                            color="success"
                            segments={[
                              {
                                percent: testQueryStats.success.percent,
                                color: 'success',
                                tooltip: 'Evaluation passed',
                              },
                            ]}
                            amount={testQueryStats.success.amount}
                          />
                          <AnalyticsRow
                            label={testQueryStats.failure.label}
                            color="error"
                            segments={[
                              {
                                percent: testQueryStats.failure.percent,
                                color: 'error',
                                tooltip: 'Evaluation failed',
                              },
                            ]}
                            amount={testQueryStats.failure.amount}
                          />
                        </Stack>
                      ),
                    )}
                  </Stack>
                  <Stack flex={1} spacing={1}>
                    <Typography variant="h5"> Lint tests </Typography>
                    {questionData[questionData.type].lintQueriesStats.map(
                      (lintQueryStats, index) => (
                        <Stack
                          key={index}
                          direction="column"
                          alignItems="flex-start"
                          spacing={1}
                        >
                          <Typography variant="body1">
                            <b>{lintQueryStats.label}</b>
                          </Typography>
                          <AnalyticsRow
                            label={lintQueryStats.success.label}
                            color="success"
                            segments={[
                              {
                                percent: lintQueryStats.success.percent,
                                color: 'success',
                                tooltip: 'Lint rules passed',
                              },
                            ]}
                            amount={lintQueryStats.success.amount}
                          />
                          <AnalyticsRow
                            label={lintQueryStats.failure.label}
                            color="error"
                            segments={[
                              {
                                percent: lintQueryStats.failure.percent,
                                color: 'error',
                                tooltip: 'Lint rules failed',
                              },
                            ]}
                            amount={lintQueryStats.failure.amount}
                          />
                        </Stack>
                      ),
                    )}
                  </Stack>
                </Stack>
              </>
            )))}
        <Stack direction="row" spacing={4} alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <PiePercent
              label={
                <Stack alignItems="center" justifyContent="center" spacing={0}>
                  <Typography variant="caption">{submittedAnswers}</Typography>
                  <Divider sx={{ width: '100%' }} />
                  <Typography variant="caption">{totalAnswers}</Typography>
                </Stack>
              }
              value={(submittedAnswers / totalAnswers) * 100}
            />
            <Box>
              <Typography variant="body1">
                <b>Submitted Answers</b>
              </Typography>
              <Typography variant="caption">
                Both in-progress or submitted
              </Typography>
            </Box>
          </Stack>
          {showSuccessRate && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <PiePercent
                value={getQuestionSuccessRate(evaluationToQuestions)}
              />
              <Box>
                <Typography variant="body1">
                  <b>Success Rate</b>
                </Typography>
                <Typography variant="caption">
                  Based on obtained points after grading
                </Typography>
              </Box>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}

const StackedLinearPercent = ({ segments, thickness = 10 }) => (
  <Stack sx={{ flex: 1 }}>
    <Grow
      in={segments.length > 0}
      timeout={1000}
      style={{ transformOrigin: '0 0 0' }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          height: thickness,
          backgroundColor: 'grey.200',
          borderRadius: thickness,
          overflow: 'hidden',
        }}
      >
        {segments.map((segment, index) => (
          <Tooltip title={`${segment.tooltip}`} key={index}>
            <Box
              sx={{
                height: thickness,
                width: `${segment.percent}%`,
                bgcolor: `${segment.color}.main`,
              }}
            />
          </Tooltip>
        ))}
      </Box>
    </Grow>
  </Stack>
)

const AnalyticsRow = ({ label, segments, amount }) => (
  <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
    <Box sx={{ width: 60, maxWidth: 60 }}>
      <Typography variant="body1">{label}</Typography>
    </Box>
    <Stack sx={{ flex: 1 }} direction="row" spacing={2} alignItems="center">
      <StackedLinearPercent segments={segments} thickness={15} />
      <Box sx={{ minWidth: 35, width: 35 }}>
        <Typography variant="caption" sx={{ textAlign: 'center' }}>
          <b>{amount}</b>
        </Typography>
      </Box>
    </Stack>
  </Stack>
)

const ColorLegend = ({ items }) => {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      {items?.map((item, index) => (
        <Tooltip title={item.tooltip} key={index}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FilledBullet state={'filled'} color={item.color} size={14} />
            <Typography variant="caption">{item.tooltip}</Typography>
          </Stack>
        </Tooltip>
      ))}
    </Stack>
  )
}

export default EvaluationAnalytics
