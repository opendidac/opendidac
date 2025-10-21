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
import { useState } from 'react'
import { FormControlLabel, FormGroup, Stack, Switch } from '@mui/material'

import ResizePanel from '@/components/layout/utils/ResizePanel'
import WebEditor from '@/components/question/type_specific/web/WebEditor'
import PreviewPanel from '@/components/question/type_specific/web/PreviewPanel'
import ScrollContainer from '@/components/layout/ScrollContainer'

const CompareWeb = ({ solution, answer }) => {
  const [isPreviewMode, setPreviewMode] = useState(false)

  const handleToggle = () => {
    setPreviewMode((prev) => !prev)
  }

  return (
    <Stack height={'100%'}>
      <Stack ml={1} mb={1}>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={isPreviewMode}
                onChange={handleToggle}
                name="previewMode"
                color="primary"
              />
            }
            label="Preview Mode"
          />
        </FormGroup>
      </Stack>
      <Stack flex={1}>
        <ResizePanel
          leftPanel={
            <ScrollContainer>
              {isPreviewMode ? (
                <PreviewPanel id={`student-preview`} web={answer} />
              ) : (
                <WebEditor
                  id={`web-student`}
                  title={'Student Answer'}
                  readOnly
                  web={answer}
                />
              )}
            </ScrollContainer>
          }
          rightPanel={
            <ScrollContainer>
              {isPreviewMode ? (
                <PreviewPanel
                  id={`solution-preview`}
                  web={{
                    html: solution.solutionHtml,
                    css: solution.solutionCss,
                    js: solution.solutionJs,
                  }}
                />
              ) : (
                <WebEditor
                  id={`web-solution`}
                  title={'Solution'}
                  readOnly
                  web={{
                    html: solution.solutionHtml,
                    css: solution.solutionCss,
                    js: solution.solutionJs,
                  }}
                />
              )}
            </ScrollContainer>
          }
        />
      </Stack>
    </Stack>
  )
}

export default CompareWeb
