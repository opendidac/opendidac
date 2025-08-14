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
import React, { useState } from 'react'
import {
  Tab,
  Tabs,
  Typography,
  Box,
  Alert,
  Stack,
  
} from '@mui/material'

import TestCaseResults from '@/components/question/type_specific/code/codeWriting/TestCaseResults'
import TabContent from '@/components/layout/utils/TabContent'
import TabPanel from '@/components/layout/utils/TabPanel'
import { AnnotationEntityType, CodeQuestionType } from '@prisma/client'
import InlineMonacoEditor from '../input/InlineMonacoEditor'
import AnswerCodeReadingOutputStatus from './code/codeReading/AnswerCodeReadingOutputStatus'
import { AnnotationProvider } from '@/context/AnnotationContext'

import ScrollContainer from '../layout/ScrollContainer'
import CodeWritingTabLabelTestSummary from './code/codeWriting/CodeWritingTabLabelTestSummary'
import StudentFileAnnotationWrapper from '../evaluations/grading/annotation/StudentFileAnnotationWrapper'
import outputEditorOptions from '@/components/question/type_specific/code/codeReading/outputEditorOptions.json'

const ConsultCode = ({ question, answer }) => {
  const codeType = question.code.codeType
  return (
    <>
      {codeType === CodeQuestionType.codeWriting && (
        <ConsultCodeWriting answer={answer} />
      )}
      {codeType === CodeQuestionType.codeReading && (
        <ConsultCodeReading question={question} answer={answer} />
      )}
    </>
  )
}

const ConsultCodeWriting = ({ answer }) => {
  const [tab, setTab] = useState(0)
  const files = answer?.codeWriting?.files
  return (
    files && (
      <>
        <Tabs
          value={tab}
          onChange={(ev, val) => setTab(val)}
          aria-label="code tabs"
        >
          <Tab
            label={<Typography variant="caption">Code</Typography>}
            value={0}
          />
          <Tab
            label={
              <CodeWritingTabLabelTestSummary
                testCaseResults={answer.codeWriting.testCaseResults}
              />
            }
            value={1}
          />
          {answer.codeWriting.files.some(
            (ansToFile) =>
              ansToFile.file.updatedAt >
              answer.codeWriting.testCaseResults[0]?.createdAt,
          ) && <Alert severity="warning">Post code-check modifications</Alert>}
        </Tabs>
        <TabPanel value={tab} index={0}>
          <TabContent>
            <ScrollContainer mt={1} px={1} spacing={1}>
              {files.map((answerToFile, index) => (
                <AnnotationProvider
                  key={index}
                  readOnly
                  annotation={answerToFile.file.annotation}
                  entityType={AnnotationEntityType.CODE_WRITING_FILE}
                  entity={answerToFile.file}
                >
                  <StudentFileAnnotationWrapper file={answerToFile.file} />
                </AnnotationProvider>
              ))}
            </ScrollContainer>
          </TabContent>
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <TabContent padding={1}>
            <ScrollContainer>
              <TestCaseResults tests={answer.codeWriting.testCaseResults} />
            </ScrollContainer>
          </TabContent>
        </TabPanel>
      </>
    )
  )
}

const ConsultCodeReading = ({ question, answer }) => {
  const language = question.code.language
  const outputs = answer?.codeReading?.outputs || []

  return (
    <Box pt={1}>
      {outputs.map((output, index) => (
        <Box key={output.id ?? index} mb={1.5}>
          {/* Snippet (read-only) */}
          <InlineMonacoEditor
            readOnly
            language={language}
            code={output.codeReadingSnippet.snippet}
            minHeight={30}
            editorOptions={{ wordWrap: 'on', minimap: { enabled: false } }}
          />

          {/* Status + Student Output (read-only plaintext) */}
          <Box p={1}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <Box pt={0.5}>
                <AnswerCodeReadingOutputStatus
                  studentOutputTest
                  status={output.status}
                />
              </Box>
              <Typography variant="caption">Your output</Typography>
            </Stack>

            <InlineMonacoEditor
              readOnly
              language="plaintext"
              minHeight={60}
              code={
                (output?.output?.toString?.() ?? output?.output ?? 'No Output Provided')
              }
              editorOptions={outputEditorOptions}
            />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default ConsultCode
