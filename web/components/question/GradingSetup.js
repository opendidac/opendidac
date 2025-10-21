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
import { useEffect, useState } from 'react'
import ConfigPopper from '@/components/layout/utils/ConfigPopper'
import { Stack, Typography } from '@mui/material'
import DropdownSelector from '@/components/input/DropdownSelector'
import GradingPolicy from '@/code/grading/policy'
import MarkdownViewer from '@/components/input/markdown/MarkdownViewer'
import { Box } from '@mui/system'

const GradingSetup = ({
  groupScope,
  questionId,
  questionType,
  gradingPolicy: initial,
  onPropertyChange,
  onUpdate,
}) => {
  const relatedPolicies = GradingPolicy.getPoliciesDict(questionType)

  const [gradingPolicy, setGradingPolicy] = useState(initial)

  useEffect(() => {
    setGradingPolicy(initial)
  }, [initial])

  return (
    <ConfigPopper
      color="info"
      placement="left-start"
      width={700}
      label={
        <Typography variant="body2">
          Grading policy{' '}
          <b>
            {
              relatedPolicies.find((type) => type.value === gradingPolicy)
                ?.label
            }
          </b>
        </Typography>
      }
    >
      <Stack spacing={1}>
        <DropdownSelector
          label={(option) => `Grading policy: ${option.label}`}
          size="small"
          color="info"
          value={gradingPolicy}
          options={relatedPolicies}
          onSelect={(value) => {
            setGradingPolicy(value)
            onPropertyChange('gradingPolicy', value)
          }}
        />
        <GradingPolicySetup
          gradingPolicyInstance={GradingPolicy.getPolicy(
            questionType,
            gradingPolicy,
          )}
          configProps={{
            groupScope: groupScope,
            questionId: questionId,
            onUpdate: () => onUpdate(),
          }}
        />
      </Stack>
    </ConfigPopper>
  )
}

const GradingPolicySetup = ({ gradingPolicyInstance, configProps }) => {
  const configComponent = gradingPolicyInstance.getConfigComponent(configProps)

  return (
    gradingPolicyInstance && (
      <Stack spacing={1}>
        <Box p={1}>
          <MarkdownViewer content={gradingPolicyInstance.documentation} />
        </Box>
        {configComponent && configComponent}
      </Stack>
    )
  )
}

export default GradingSetup
