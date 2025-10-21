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
import UserHelpPopper from '@/components/feedback/UserHelpPopper'
import { Typography } from '@mui/material'
import GradingPolicy from '@/code/grading/policy'
import MarkdownViewer from '@/components/input/markdown/MarkdownViewer'

const GradingPolicyBreakdown = ({
  questionType,
  gradingPolicy,
  maxPoints,
  solution,
  answer,
}) => {
  const policy = GradingPolicy.getPolicy(questionType, gradingPolicy)

  const { finalScore, breakdown } = policy.breakdown({
    solution,
    answer,
    totalPoints: maxPoints,
  })

  return (
    <UserHelpPopper
      label={
        <Typography variant="body2" color="textSecondary" noWrap>
          {policy.label} <b>({finalScore}pts)</b>
        </Typography>
      }
    >
      <MarkdownViewer content={breakdown} />
    </UserHelpPopper>
  )
}

export default GradingPolicyBreakdown
