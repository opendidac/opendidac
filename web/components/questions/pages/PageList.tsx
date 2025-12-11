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
import { fetcher } from '../../../core/utils'
import QuestionUpdate from '../../question/QuestionUpdate'
import ResizableDrawer from '../../layout/utils/ResizableDrawer'
import CopyQuestionDialog from '../list/CopyQuestionDialog'
import ImportQuestionsDialog from '../list/ImportQuestionsDialog'
import QuestionsGrid from '../list/QuestionsGrid'
import { usePinnedFilter } from '@/context/PinnedFilterContext'
import type { ProfessorQuestionListingPayload } from '@/api-types/[groupScope]/questions/index'

interface ExportQuestionsButtonProps {
  selection: ProfessorQuestionListingPayload[]
  groupScope: string
  onExportSuccess?: () => void
}

const ExportQuestionsButton: React.FC<ExportQuestionsButtonProps> = ({ 
  selection, 
  groupScope, 
  onExportSuccess 
}) => {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showSnackbar(`Export failed: ${errorMessage}`, 'error')
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

const PageList: React.FC = () => {
  const router = useRouter()

  const { groupScope } = router.query

  const { show: showSnackbar } = useSnackbar()

  const { getPinnedFilter } = usePinnedFilter()
  
  const pinnedFilter = useMemo(
    () => getPinnedFilter(groupScope as string),
    [getPinnedFilter, groupScope]
  )
  

  const [queryString, setQueryString] = useState<string>(
    pinnedFilter ? new URLSearchParams(pinnedFilter as any).toString() : '',
  )

  const {
    data: questions,
    error,
    mutate,
  } = useSWR<ProfessorQuestionListingPayload[]>(
    groupScope ? `/api/${groupScope}/questions?${queryString}` : null,
    fetcher,
  )

  const setAppliedFilter = useCallback((filter: Record<string, any>) => {
    setQueryString(new URLSearchParams(filter).toString())
  }, [])

  const [openSideUpdate, setOpenSideUpdate] = useState<boolean>(false)
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false)
  const [copyDialogOpen, setCopyDialogOpen] = useState<boolean>(false)
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false)

  const [selected, setSelected] = useState<ProfessorQuestionListingPayload | undefined>(undefined)

  const [selection, setSelection] = useState<ProfessorQuestionListingPayload[]>([])

  useEffect(() => {
    setSelection([])
  }, [groupScope])

  const createQuestion = useCallback(
    async (type: string, options: Record<string, any>) => {
      if (!groupScope || typeof groupScope !== 'string') return
      
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
        .then(async (result: { id: string }) => {
          showSnackbar('Question created', 'success')
          await mutate() // Refresh the list
          await router.push(`/${groupScope}/questions/${result.id}`)
        })
        .catch(() => {
          showSnackbar('Error creating questions', 'error')
        })
    },
    [groupScope, router, showSnackbar, mutate],
  )

  const copyQuestion = useCallback(
    async (questionId: string) => {
      if (!groupScope || typeof groupScope !== 'string') return
      
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
    async (result: { count: number }) => {
      showSnackbar(
        `Successfully imported ${result.count} question${result.count > 1 ? 's' : ''}`,
        'success',
      )
      await mutate() // Refresh the questions list
    },
    [showSnackbar, mutate],
  )

  if (!groupScope || typeof groupScope !== 'string') {
    return null
  }

  return (
    <Authorization allowRoles={[Role.PROFESSOR] as any}>
      <LayoutMain header={<MainMenu />} subheader={undefined}>
        <LayoutSplitScreen
          leftPanel={
            <QuestionFilter
              filters={pinnedFilter}
              onApplyFilter={setAppliedFilter}
              groupId={groupScope}
            />
          }
          rightWidth={80}
          subheader={undefined}
          footer={undefined}
          rightPanel={
            <Loading loading={!questions} errors={error ? [error] : [] as any}>
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
                    onRowClick={(question: ProfessorQuestionListingPayload) => {
                      setSelected(question)
                      setOpenSideUpdate(true)
                    }}
                    groupScope={groupScope}
                    setCopyDialogOpen={setCopyDialogOpen}
                    setOpenSideUpdate={(q: ProfessorQuestionListingPayload) => {
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
                          groupScope={groupScope}
                          questionId={selected.id}
                          onUpdate={async () => {
                            await mutate()
                            // Refresh the selected question - fetch it again from the list
                            // Since mutate() doesn't return the data directly, we'll just refresh
                            // and the selected question will be updated when the list refreshes
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
          handleAddQuestion={async (type: string, options: Record<string, any>) => {
            await createQuestion(type, options)
            setAddDialogOpen(false)
          }}
          inheritedTags={pinnedFilter?.tags || []}
        />
        <CopyQuestionDialog
          open={copyDialogOpen}
          onClose={() => setCopyDialogOpen(false)}
          handleCopyQuestion={async () => {
            if (selected) {
              await copyQuestion(selected.id)
              setCopyDialogOpen(false)
            }
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

