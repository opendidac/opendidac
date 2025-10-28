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
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import LayoutMain from '../../layout/LayoutMain'
import LayoutSplitScreen from '../../layout/LayoutSplitScreen'
import { Role } from '@prisma/client'
import Authorization from '../../security/Authorization'
import QuestionFilter from '../../question/QuestionFilter'
import MainMenu from '../../layout/MainMenu'
import { Box, Button, Stack, Typography } from '@mui/material'
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import { useSnackbar } from '../../../context/SnackbarContext'
import { useRouter } from 'next/router'
import AddQuestionDialog from '../list/AddQuestionDialog'
import AlertFeedback from '../../feedback/AlertFeedback'
import Loading from '../../feedback/Loading'
import { fetcher } from '../../../code/utils'
import QuestionUpdate from '../../question/QuestionUpdate'
import ResizableDrawer from '../../layout/utils/ResizableDrawer'
import CopyQuestionDialog from '../list/CopyQuestionDialog'
import ImportQuestionsDialog from '../list/ImportQuestionsDialog'
import QuestionsGrid from '../list/QuestionsGrid'
import { usePinnedFilter } from '@/context/PinnedFilterContext'

const ExportQuestionsButton = ({ selection, groupScope, onExportSuccess }) => {
  const { show: showSnackbar } = useSnackbar()

  const handleExportSelected = useCallback(async () => {
    if (selection.length === 0) return

    const questionIds = selection.map((q) => q.id)

    try {
      const response = await fetch(`/api/${groupScope}/questions/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          questionIds,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      const result = await response.json()

      // Create and download the JSON file
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: 'application/json',
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${groupScope}-questions-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showSnackbar(
        `Successfully exported ${result.questions.length} question${result.questions.length > 1 ? 's' : ''}`,
        'success',
      )
      onExportSuccess?.() // Clear selection after export
    } catch (error) {
      console.error('Export error:', error)
      showSnackbar(`Export failed: ${error.message}`, 'error')
    }
  }, [selection, groupScope, showSnackbar, onExportSuccess])

  const isDisabled = selection.length === 0

  return (
    <Button
      variant="text"
      onClick={isDisabled ? undefined : handleExportSelected}
      disabled={isDisabled}
      startIcon={<DownloadIcon />}
      color="success"
    >
      {isDisabled
        ? 'Export questions'
        : `Export ${selection.length} question${selection.length > 1 ? 's' : ''}`}
    </Button>
  )
}

const PageList = () => {
  const router = useRouter()

  const { groupScope } = router.query

  const { show: showSnackbar } = useSnackbar()

  const { getPinnedFilter } = usePinnedFilter()
  const pinnedFilter = useMemo(
    () => getPinnedFilter(groupScope),
    [getPinnedFilter, groupScope],
  )

  const [queryString, setQueryString] = useState(
    pinnedFilter ? new URLSearchParams(pinnedFilter).toString() : '',
  )

  const {
    data: questions,
    error,
    mutate,
  } = useSWR(
    `/api/${groupScope}/questions?${queryString}`,
    groupScope ? fetcher : null,
  )

  const setAppliedFilter = useCallback((filter) => {
    setQueryString(new URLSearchParams(filter).toString())
  }, [])

  const [openSideUpdate, setOpenSideUpdate] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const [selected, setSelected] = useState(undefined)

  const [selection, setSelection] = useState([])

  useEffect(() => {
    setSelection([])
  }, [groupScope])

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

  const handleImportSuccess = useCallback(
    async (result) => {
      showSnackbar(
        `Successfully imported ${result.count} question${result.count > 1 ? 's' : ''}`,
        'success',
      )
      await mutate() // Refresh the questions list
    },
    [showSnackbar, mutate],
  )

  return (
    <Authorization allowRoles={[Role.PROFESSOR]}>
      <LayoutMain header={<MainMenu />}>
        <LayoutSplitScreen
          leftPanel={
            <QuestionFilter
              filters={pinnedFilter}
              onApplyFilter={setAppliedFilter}
              groupId={groupScope}
            />
          }
          rightWidth={80}
          rightPanel={
            <Loading loading={!questions} errors={[error]}>
              {questions && (
                <Stack height={'100%'} p={1} pt={2}>
                  <QuestionsGrid
                    questions={questions}
                    enableSelection={true}
                    actions={
                      <Stack direction={'row'} spacing={1}>
                        <Button onClick={() => setAddDialogOpen(true)}>
                          Create a new question
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => setImportDialogOpen(true)}
                          startIcon={<UploadIcon />}
                        >
                          Import
                        </Button>
                        <ExportQuestionsButton
                          selection={selection}
                          groupScope={groupScope}
                          onExportSuccess={() => setSelection([])}
                        />
                      </Stack>
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
              )}
            </Loading>
          }
        />
        <AddQuestionDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          handleAddQuestion={async (type, options) => {
            await createQuestion(type, options)
            setAddDialogOpen(false)
          }}
          inheritedTags={pinnedFilter?.tags || []}
        />
        <CopyQuestionDialog
          open={copyDialogOpen}
          onClose={() => setCopyDialogOpen(false)}
          handleCopyQuestion={async () => {
            await copyQuestion(selected.id)
            setCopyDialogOpen(false)
          }}
        />
        <ImportQuestionsDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onImportSuccess={handleImportSuccess}
          groupScope={groupScope}
        />
      </LayoutMain>
    </Authorization>
  )
}

export default PageList
