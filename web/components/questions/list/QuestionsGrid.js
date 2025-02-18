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
import DateTimeAgo from '@/components/feedback/DateTimeAgo'
import QuestionTypeIcon from '@/components/question/QuestionTypeIcon'
import QuestionTagsViewer from '@/components/question/tags/QuestionTagsViewer'
import CodeQuestionTypeIcon from '@/components/question/type_specific/code/CodeQuestionTypeIcon'
import LanguageIcon from '@/components/question/type_specific/code/LanguageIcon'
import GridGrouping from '@/components/ui/GridGrouping'
import { IconButton, Tooltip, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { QuestionType } from '@prisma/client'
import { useRouter } from 'next/router'
import React, { useState, useCallback } from 'react'
import { weeksAgo } from './utils'
import { getTextByType } from '@/components/question/types'
import Image from 'next/image'
import DialogFeedback from '@/components/feedback/DialogFeedback'
import { useSnackbar } from '../../../context/SnackbarContext'

const QuestionsGrid = ({
  groupScope,
  questions,
  setSelected,
  enableSelection,
  selection,
  setSelection,
  onRowClick,
  setOpenSideUpdate,
  setCopyDialogOpen,
  onDelete,
  actions,
}) => {
  const router = useRouter()
  const { show: showSnackbar } = useSnackbar()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  const deleteQuestion = useCallback(async () => {
    if (!selectedQuestion) return

    await fetch(`/api/${groupScope}/questions`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ question: selectedQuestion }),
    })
      .then((res) => res.json())
      .then(async () => {
        onDelete && onDelete(selectedQuestion)
        showSnackbar('Question deleted', 'success')
      })
      .catch(() => {
        showSnackbar('Error deleting question', 'error')
      })
  }, [selectedQuestion, groupScope, onDelete, showSnackbar])

  return (
    <React.Fragment>
      <GridGrouping
        label="Questions"
        enableSelection={enableSelection}
        selection={selection}
        onSelectionChange={(newSelection) => {
          console.log(newSelection)
          setSelection(newSelection)
        }}
        actions={actions}
        header={{
          actions: {
            label: 'Actions',
            width: '160px',
          },
          columns: [
            {
              label: 'Type',
              column: { width: '140px' },
              renderCell: (row) => {
                if (row.type === QuestionType.code) {
                  return (
                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                      <QuestionTypeIcon type={row.type} size={24} />
                      <CodeQuestionTypeIcon
                        codeType={row.code?.codeType}
                        size={18}
                      />
                      <LanguageIcon
                        language={row.code?.language}
                        size={18}
                        withLabel
                      />
                    </Stack>
                  )
                } else {
                  return (
                    <QuestionTypeIcon type={row.type} size={24} withLabel />
                  )
                }
              },
            },
            {
              label: 'Title',
              column: { flexGrow: 1 },
              renderCell: (row) => (
                <Typography variant={'body2'}>{row.title}</Typography>
              ),
            },
            {
              label: 'Tags',
              column: { width: '200px' },
              renderCell: (row) => (
                <QuestionTagsViewer
                  size={'small'}
                  tags={row.questionToTag}
                  collapseAfter={2}
                />
              ),
            },
            {
              label: 'Updated',
              column: { width: '90px' },
              renderCell: (row) => (
                <DateTimeAgo date={new Date(row.updatedAt)} />
              ),
            },
          ],
        }}
        items={questions.map((question) => ({
          ...question,
          meta: {
            key: question.id,
            onClick: () => {
              onRowClick && onRowClick(question)
            },
            actions: [
              <React.Fragment key="actions">
                <Tooltip title="Make a copy">
                  <IconButton
                    color="primary"
                    onClick={(ev) => {
                      ev.preventDefault()
                      ev.stopPropagation()
                      setSelected && setSelected(question)
                      setCopyDialogOpen(true)
                    }}
                  >
                    <Image
                      alt={'Make a copy'}
                      src={'/svg/icons/copy.svg'}
                      width={16}
                      height={16}
                    />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Update in new page">
                  <IconButton
                    color="primary"
                    onClick={async (ev) => {
                      ev.preventDefault()
                      ev.stopPropagation()
                      await router.push(
                        `/${groupScope}/questions/${question.id}`,
                      )
                    }}
                  >
                    <Image
                      alt={'Update in new page'}
                      src={'/svg/icons/update.svg'}
                      width={16}
                      height={16}
                    />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Update in overlay">
                  <IconButton
                    color="primary"
                    onClick={(ev) => {
                      ev.preventDefault()
                      ev.stopPropagation()
                      setOpenSideUpdate(question)
                    }}
                  >
                    <Image
                      alt={'Update in overlay'}
                      src={'/svg/icons/aside.svg'}
                      width={16}
                      height={16}
                    />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete question">
                  <IconButton
                    color="primary"
                    onClick={(ev) => {
                      ev.preventDefault()
                      ev.stopPropagation()
                      setSelectedQuestion(question)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Image
                      alt={'Delete question'}
                      src={'/svg/icons/delete.svg'}
                      width={16}
                      height={16}
                    />
                  </IconButton>
                </Tooltip>
              </React.Fragment>,
            ],
          },
        }))}
        groupings={[
          {
            groupBy: 'updatedAt',
            option: 'Last Update',
            type: 'date',
            renderLabel: (row) => weeksAgo(row.label),
          },
          {
            groupBy: 'questionToTag',
            option: 'Tags',
            type: 'array',
            property: 'label',
            renderLabel: (row) => row.label,
          },
          {
            groupBy: 'type',
            option: 'Type',
            type: 'element',
            renderLabel: (row) => getTextByType(row.label),
          },
        ]}
      />
      <DialogFeedback
        open={deleteDialogOpen}
        title="Delete question"
        content={
          <Typography variant="body1">
            You are about to delete this question. Are you sure?
          </Typography>
        }
        onClose={() => {
          setDeleteDialogOpen(false)
          setSelectedQuestion(null)
        }}
        onConfirm={async () => {
          await deleteQuestion()
          setDeleteDialogOpen(false)
          setSelectedQuestion(null)
        }}
      />
    </React.Fragment>
  )
}

export default QuestionsGrid
