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
import React, { useState, useEffect } from 'react'
import { Stack, Tab, Tabs, Typography } from '@mui/material'

import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import ResizePanel from '../../layout/utils/ResizePanel'
import ScrollContainer from '../../layout/ScrollContainer'
import WebEditor from './web/WebEditor'
import PreviewPanel from './web/PreviewPanel'

const Web = ({ id = 'web', web: initial, onChange }) => {
  const [tab, setTab] = useState('solution')

  const [web, setWeb] = useState(initial)

  useEffect(() => {
    setWeb(initial)
  }, [initial, id])

  return (
    <Stack spacing={1} width="100%" height="100%" position="relative">
      <TabContext value={tab.toString()}>
        <ResizePanel
          leftPanel={
            <Stack sx={{ height: '100%', pb: 2 }}>
              <Tabs
                value={tab}
                onChange={(ev, val) => setTab(val)}
                aria-label="code tabs"
              >
                <Tab
                  label={<Typography variant="caption">Solution</Typography>}
                  value={'solution'}
                />
                <Tab
                  label={<Typography variant="caption">Template</Typography>}
                  value={'template'}
                />
              </Tabs>
              <ScrollContainer pb={24}>
                <TabPanel id="solution" value={'solution'}>
                  <Stack spacing={1}>
                    <WebEditor
                      id={`${id}-web-solution`}
                      web={{
                        html: web?.solutionHtml,
                        css: web?.solutionCss,
                        js: web?.solutionJs,
                      }}
                      onChange={(updatedWeb) => {
                        const newWeb = {
                          ...web,
                          solutionHtml: updatedWeb.html,
                          solutionCss: updatedWeb.css,
                          solutionJs: updatedWeb.js,
                        }
                        setWeb(newWeb)
                        onChange(newWeb)
                      }}
                    />
                  </Stack>
                </TabPanel>
                <TabPanel id="template" value={'template'}>
                  <Stack spacing={1}>
                    <WebEditor
                      id={`${id}-web-template`}
                      web={{
                        html: web?.templateHtml,
                        css: web?.templateCss,
                        js: web?.templateJs,
                      }}
                      onChange={(updatedWeb) => {
                        const newWeb = {
                          ...web,
                          templateHtml: updatedWeb.html,
                          templateCss: updatedWeb.css,
                          templateJs: updatedWeb.js,
                        }
                        setWeb(newWeb)
                        onChange(newWeb)
                      }}
                    />
                  </Stack>
                </TabPanel>
              </ScrollContainer>
            </Stack>
          }
          rightPanel={
            <PreviewPanel
              id={`${id}-preview`}
              web={(() => {
                switch (tab) {
                  case 'solution':
                    return {
                      html: web?.solutionHtml,
                      css: web?.solutionCss,
                      js: web?.solutionJs,
                    }
                  case 'template':
                    return {
                      html: web?.templateHtml,
                      css: web?.templateCss,
                      js: web?.templateJs,
                    }
                }
              })()}
            />
          }
        />
      </TabContext>
    </Stack>
  )
}

export default Web
