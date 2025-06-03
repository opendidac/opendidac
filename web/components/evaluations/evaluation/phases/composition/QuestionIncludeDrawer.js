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
import { fetcher } from '@/code/utils'
import Loading from '@/components/feedback/Loading'
import ResizableDrawer from '@/components/layout/utils/ResizableDrawer'
import QuestionFilter from '@/components/question/QuestionFilter'
import QuestionsGrid from '@/components/questions/list/QuestionsGrid'
import { Alert, Button } from '@mui/material'
import { Box, Stack } from '@mui/system'
import { useState } from 'react'
import useSWR from 'swr'

const QuestionIncludeDrawer = ({
  groupScope,
  open,
  includedQuestions,
  onClose,
  onInclude,
}) => {
  const [queryString, setQueryString] = useState('')

  const [selection, setSelection] = useState([])

  const { data: searchQuestions, error: errorSearch } = useSWR(
    `/api/${groupScope}/questions?${queryString}`,
    groupScope ? fetcher : null,
  )

  const isQuestionIncluded = (question) => {
    return includedQuestions.find((q) => q.id === question.id)
  }

  return (
    <ResizableDrawer open={open} width={85} onClose={() => onClose()}>
      <Stack direction={'row'} flex={1}>
        <Box minWidth={'250px'}>
          <QuestionFilter
            filters={queryString}
            onApplyFilter={setQueryString}
          />
        </Box>
        <Loading loading={!searchQuestions}>
          {includedQuestions && searchQuestions && (
            <Stack spacing={2} padding={2} width={'100%'}>
              <QuestionsGrid
                enableSelection
                questions={searchQuestions.filter(
                  (q) => !isQuestionIncluded(q),
                )}
                selection={selection}
                actions={
                  <Stack direction={'row'} spacing={1}>
                    {selection.length > 0 ? (
                      <Alert
                        action={
                          <Button
                            variant={'text'}
                            color={'primary'}
                            size={'small'}
                            onClick={() => {
                              onInclude(selection.map((q) => q.id))
                              setSelection([])
                              onClose()
                            }}
                          >
                            Include
                          </Button>
                        }
                      >
                        You have selected {selection.length} questions
                      </Alert>
                    ) : (
                      <Alert severity={'info'}>
                        Select questions to include in the evaluation
                      </Alert>
                    )}
                  </Stack>
                }
                setSelection={setSelection}
              />
            </Stack>
          )}
        </Loading>
      </Stack>
    </ResizableDrawer>
  )
}

export default QuestionIncludeDrawer
