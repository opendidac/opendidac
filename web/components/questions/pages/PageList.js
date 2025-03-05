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
import useSWR from 'swr'
import React, { useCallback, useEffect, useState } from 'react'
import LayoutMain from '../../layout/LayoutMain'
import LayoutSplitScreen from '../../layout/LayoutSplitScreen'
import { Role } from '@prisma/client'
import Authorization from '../../security/Authorization'
import QuestionFilter from '../../question/QuestionFilter'
import MainMenu from '../../layout/MainMenu'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useSnackbar } from '../../../context/SnackbarContext'
import { useRouter } from 'next/router'
import AddQuestionDialog from '../list/AddQuestionDialog'
import AlertFeedback from '../../feedback/AlertFeedback'
import Loading from '../../feedback/Loading'
import { fetcher } from '../../../code/utils'
import QuestionUpdate from '../../question/QuestionUpdate'
import ResizableDrawer from '../../layout/utils/ResizableDrawer'
import CopyQuestionDialog from '../list/CopyQuestionDialog'
import QuestionsGrid from '../list/QuestionsGrid'

const PageList = () => {
  const router = useRouter()

  const { groupScope } = router.query

  const { show: showSnackbar } = useSnackbar()

  const [queryString, setQueryString] = useState('')

  useEffect(() => {
    setQueryString('')
  }, [groupScope])

  const {
    data: questions,
    error,
    mutate,
  } = useSWR(
    `/api/${groupScope}/questions?${queryString}`,
    groupScope ? fetcher : null,
  )

  const [openSideUpdate, setOpenSideUpdate] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)

  const [selected, setSelected] = useState(undefined)

  const [selection, setSelection] = useState([])

  const createQuestion = useCallback(
    async (type, options) => {
      // language only used for code questions
      await fetch(`/api/${groupScope}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          type,
          options,
        }),
      })
        .then((res) => res.json())
        .then(async (createdQuestion) => {
          showSnackbar('Question created', 'success')
          await mutate([...questions, createdQuestion])
          await router.push(`/${groupScope}/questions/${createdQuestion.id}`)
        })
        .catch(() => {
          showSnackbar('Error creating questions', 'error')
        })
    },
    [groupScope, router, showSnackbar, questions, mutate],
  )

  const copyQuestion = useCallback(
    async (questionId) => {
      await fetch(`/api/${groupScope}/questions/${questionId}/copy`, {
        method: 'POST',
      })
        .then((res) => res.json())
        .then(async () => {
          showSnackbar('Question copied', 'success')
          await mutate()
        })
        .catch(() => {
          showSnackbar('Error copying question', 'error')
        })
    },
    [groupScope, showSnackbar, mutate],
  )

  return (
    <Authorization allowRoles={[Role.PROFESSOR]}>
      <Loading loading={!questions} errors={[error]}>
        <LayoutMain header={<MainMenu />}>
          <LayoutSplitScreen
            leftPanel={
              <QuestionFilter
                withArchived={true} 
                filters={queryString}
                onApplyFilter={setQueryString}
              />
            }
            rightWidth={80}
            rightPanel={
              questions && (
                <Stack height={'100%'} p={1} pt={2}>
                  <QuestionsGrid
                    questions={questions}
                    actions={
                      <Button onClick={() => setAddDialogOpen(true)}>
                        Create a new question
                      </Button>
                    }
                    setSelected={setSelected}
                    selection={selection}
                    setSelection={setSelection}
                    setAddDialogOpen={setAddDialogOpen}
                    onRowClick={(question) => {
                      setSelected(question)
                      setOpenSideUpdate(true)
                    }}
                    groupScope={groupScope}
                    setCopyDialogOpen={setCopyDialogOpen}
                    setOpenSideUpdate={(q) => {
                      setSelected(q)
                      setOpenSideUpdate(true)
                    }}
                  />
                  <ResizableDrawer
                    open={openSideUpdate}
                    width={85}
                    onClose={() => {
                      setSelected(undefined)
                      setOpenSideUpdate(false)
                    }}
                  >
                    <Box pt={2} width={'100%'} height={'100%'}>
                      {openSideUpdate && selected && (
                        <QuestionUpdate
                          groupScope={router.query.groupScope}
                          questionId={selected.id}
                          onUpdate={async (question) => {
                            await mutate()
                            setSelected(question)
                          }}
                          onDelete={async () => {
                            await mutate()
                            setSelected(undefined)
                            setOpenSideUpdate(false)
                          }}
                        />
                      )}
                    </Box>
                  </ResizableDrawer>

                  {questions && questions.length === 0 && (
                    <AlertFeedback severity="info">
                      <Typography variant="body1">
                        No questions found in this group. Try changing your
                        search criteria
                      </Typography>
                    </AlertFeedback>
                  )}
                </Stack>
              )
            }
          />
          <AddQuestionDialog
            open={addDialogOpen}
            onClose={() => setAddDialogOpen(false)}
            handleAddQuestion={async (type, options) => {
              await createQuestion(type, options)
              setAddDialogOpen(false)
            }}
          />
          <CopyQuestionDialog
            open={copyDialogOpen}
            onClose={() => setCopyDialogOpen(false)}
            handleCopyQuestion={async () => {
              await copyQuestion(selected.id)
              setCopyDialogOpen(false)
            }}
          />
        </LayoutMain>
      </Loading>
    </Authorization>
  )
}

export default PageList
