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

import React from 'react'
import { Alert, Box, Stack, Tab, Tabs, Typography } from '@mui/material'

import ResizePanel from '@/components/layout/utils/ResizePanel'
import FileEditor from '@/components/question/type_specific/code/FileEditor'
import TestCaseResults from '@/components/question/type_specific/code/codeWriting/TestCaseResults'
import TabPanel from '@/components/layout/utils/TabPanel'
import TabContent from '@/components/layout/utils/TabContent'
import ScrollContainer from '@/components/layout/ScrollContainer'
import {
  AnnotationEntityType,
  CodeQuestionType,
  StudentAnswerCodeReadingOutputStatus,
  StudentPermission,
} from '@prisma/client'
import InlineMonacoEditor from '../input/InlineMonacoEditor'
import { AnnotationProvider } from '@/context/AnnotationContext'

import CodeWritingTabLabelTestSummary from './code/codeWriting/CodeWritingTabLabelTestSummary'
import StudentFileAnnotationWrapper from '../evaluations/grading/annotation/StudentFileAnnotationWrapper'
import outputEditorOptions from '@/components/question/type_specific/code/codeReading/outputEditorOptions.json'

const CompareCode = ({ readOnly, student, question, solution, answer }) => {
  return (
    <>
      {solution?.codeType === CodeQuestionType.codeWriting && (
        <CompareCodeWriting
          readOnly={readOnly}
          student={student}
          question={question}
          solution={solution}
          answer={answer}
        />
      )}
      {solution?.codeType === CodeQuestionType.codeReading && (
        <CompareCodeReading solution={solution} answer={answer} />
      )}
    </>
  )
}

const PostCodeCheckModificationWarning = ({ answer }) => {
  return (
    answer.codeWriting.files.some(
      (ansToFile) =>
        ansToFile.file.updatedAt >
        answer.codeWriting.testCaseResults[0]?.createdAt,
    ) && <Alert severity="warning">Post code-check modifications</Alert>
  )
}

const CompareCodeWriting = ({
  readOnly,
  student,
  question,
  solution,
  answer,
}) => {
  const [tab, setTab] = React.useState(0)

  return (
    answer &&
    solution && (
      <Stack height={'100%'} width={'100%'} overflow={'auto'} pb={'50px'}>
        <Box flexGrow={1}>
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
            <PostCodeCheckModificationWarning answer={answer} />
          </Tabs>
          <TabPanel value={tab} index={0}>
            <TabContent>
              <ResizePanel
                leftPanel={
                  <ScrollContainer px={1} mt={1} spacing={1}>
                    {answer.codeWriting.files?.map(
                      (answerToFile, index) =>
                        (answerToFile.studentPermission ===
                          StudentPermission.UPDATE && (
                          <AnnotationProvider
                            key={index}
                            annotation={answerToFile.file.annotation}
                            readOnly={readOnly}
                            student={student}
                            question={question}
                            entityType={AnnotationEntityType.CODE_WRITING_FILE}
                            entity={answerToFile.file}
                          >
                            <StudentFileAnnotationWrapper
                              file={answerToFile.file}
                            />
                          </AnnotationProvider>
                        )) ||
                        (answerToFile.studentPermission !==
                          StudentPermission.UPDATE && (
                          <FileEditor
                            file={answerToFile.file}
                            readonlyPath
                            readonlyContent
                          />
                        )),
                    )}
                  </ScrollContainer>
                }
                rightPanel={
                  <ScrollContainer px={1} pt={1} spacing={1}>
                    {solution.codeWriting.solutionFiles?.map(
                      (solutionToFile, index) => (
                        <FileEditor
                          key={index}
                          file={solutionToFile.file}
                          readonlyPath
                          readonlyContent
                        />
                      ),
                    )}
                  </ScrollContainer>
                }
                rightWidth={
                  solution.codeWriting.solutionFiles?.length > 0 ? 45 : 0
                }
              />
            </TabContent>
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <TabContent padding={1}>
              <TestCaseResults tests={answer.codeWriting.testCaseResults} />
            </TabContent>
          </TabPanel>
        </Box>
      </Stack>
    )
  )
}

const CodeReadingSummary = ({ studentOutputs }) => {
  const correctOutputs = studentOutputs.filter(
    (output) => output.status === StudentAnswerCodeReadingOutputStatus.MATCH,
  ).length
  const incorrectOutputs = studentOutputs.filter(
    (output) => output.status === StudentAnswerCodeReadingOutputStatus.MISMATCH,
  ).length
  const unansweredOutputs = studentOutputs.filter(
    (output) => output.status === StudentAnswerCodeReadingOutputStatus.NEUTRAL,
  ).length

  return (
    <Stack spacing={2} direction={'row'} width={'100%'} pl={1}>
      {correctOutputs > 0 && (
        <Alert severity="success">{correctOutputs} correct output(s).</Alert>
      )}
      {incorrectOutputs > 0 && (
        <Alert severity="error">{incorrectOutputs} incorrect output(s).</Alert>
      )}
      {unansweredOutputs > 0 && (
        <Alert severity="warning">
          {unansweredOutputs} unanswered output(s).
        </Alert>
      )}
      {correctOutputs === studentOutputs.length &&
        unansweredOutputs === 0 &&
        incorrectOutputs === 0 && (
          <Alert severity="success">
            Student matched all expected outputs correctly.
          </Alert>
        )}
    </Stack>
  )
}

const CompareCodeReading = ({ solution, answer }) => {
  const { snippets } = solution.codeReading
  const { outputs } = answer.codeReading

  return (
    <Stack spacing={1} p={0} pt={1} height={'100%'}>
      <CodeReadingSummary studentOutputs={outputs} />
      <Box>
        {snippets.map((snippet, index) => {
          const studentOutput = outputs.find(
            (o) => o.codeReadingSnippet.order === snippet.order,
          )

          const severity =
            studentOutput &&
            studentOutput.status === StudentAnswerCodeReadingOutputStatus.MATCH
              ? 'success'
              : 'error'

          return (
            <Box key={snippet.id ?? snippet.order ?? index}>
              {/* Snippet (read-only code) */}
              <InlineMonacoEditor
                readOnly
                language="cpp"
                minHeight={30}
                code={snippet.snippet}
                editorOptions={{ wordWrap: 'on', minimap: { enabled: false } }}
              />

              <Alert
                severity={severity}
                variant="standard"
                icon={false}
                sx={{
                  px: 1,
                  '& .MuiAlert-message': { width: '100%' },
                }}
              >
                <Stack direction="row" spacing={1} width="100%">
                  {/* Student Output (read-only plaintext) */}
                  <Stack flex={1} spacing={0.5}>
                    <InlineMonacoEditor
                      readOnly
                      language="plaintext"
                      minHeight={60}
                      code={
                        studentOutput?.output?.toString?.() ??
                        studentOutput?.output ??
                        'No Output Provided'
                      }
                      editorOptions={outputEditorOptions}
                    />
                  </Stack>

                  {/* Expected Output (read-only plaintext) */}
                  <Stack flex={1} spacing={0.5}>
                    <InlineMonacoEditor
                      readOnly
                      language="plaintext"
                      minHeight={60}
                      code={snippet.output ?? ''}
                      editorOptions={outputEditorOptions}
                    />
                  </Stack>
                </Stack>
              </Alert>
            </Box>
          )
        })}
      </Box>
    </Stack>
  )
}
export default CompareCode
