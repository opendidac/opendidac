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
import Image from 'next/image'
import Link from 'next/link'
import { EvaluationPhase, EvaluationStatus } from '@prisma/client'
import { Box, Button, IconButton, Stack, Tooltip } from '@mui/material'

import { getStudentEntryLink } from '@/core/utils'
import DisplayPhase from '../DisplayPhase'
import GridGrouping from '@/components/ui/GridGrouping'
import { weeksAgo } from '@/components/questions/list/utils'
import DateTimeAgo from '@/components/feedback/DateTimeAgo'
import AddEvaluationDialog from './AddEvaluationDialog'
import { phaseGT } from '@/core/phase'
import ArchivalStatusMiniStamp from '@/components/admin/archiving/ArchivalStatusMiniStamp'

const ListEvaluation = ({ groupScope, evaluations, onStart, onDelete }) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  return (
    <Box minWidth="100%" height="100%" p={2} bgcolor="background.paper">
      <GridGrouping
        label="Evaluations"
        actions={
          <Button onClick={() => setAddDialogOpen(true)}>
            Create a new evaluation
          </Button>
        }
        header={{
          actions: {
            label: 'Actions',
            width: '110px',
          },
          columns: [
            {
              label: 'Label',
              column: { flexGrow: 1 },
              renderCell: (row) => row.label,
            },
            {
              label: 'Archival',
              column: { width: '100px' },
              renderCell: (row) => <ArchivalStatusMiniStamp evaluation={row} />,
            },
            {
              label: 'Phase',
              column: { width: '100px' },
              renderCell: (row) => (
                <Stack direction="row" spacing={1} alignItems="center">
                  <DisplayPhase phase={row.phase} />
                  {row.phase === EvaluationPhase.DRAFT && (
                    <Button
                      key="promote-to-in-progress"
                      color="info"
                      onClick={(ev) => onStart(ev, row)}
                      startIcon={
                        <Image
                          alt="Promote"
                          src="/svg/icons/finish.svg"
                          width="18"
                          height="18"
                        />
                      }
                    >
                      Start
                    </Button>
                  )}
                </Stack>
              ),
            },
            {
              label: 'Updated',
              column: { width: '120px' },
              renderCell: (row) => (
                <DateTimeAgo date={new Date(row.updatedAt)} />
              ),
            },
            {
              label: 'Questions',
              column: { width: '80px' },
              renderCell: (row) => row._count?.evaluationToQuestions || 'N/A',
            },
            {
              label: 'Students',
              column: { width: '80px' },
              renderCell: (row) => row.students.length,
            },
          ],
        }}
        items={evaluations?.map((evaluation) => ({
          ...evaluation,
          meta: {
            key: `evaluation-${evaluation.id}`,
            linkHref: `/${groupScope}/evaluations/${evaluation.id}`,
            actions: [
              <React.Fragment key="actions">
                {phaseGT(evaluation.phase, EvaluationPhase.COMPOSITION) &&
                  (!evaluation.desktopAppRequired ||
                    (evaluation.desktopAppRequired && evaluation.pin)) && (
                    <Tooltip
                      title={
                        evaluation.desktopAppRequired
                          ? 'Copy PIN to clipboard'
                          : 'Copy student link to clipboard'
                      }
                      key="add-link-to-clipboard"
                    >
                      <IconButton
                        onClick={(ev) => {
                          ev.preventDefault()
                          ev.stopPropagation()
                          ;(async () => {
                            if (evaluation.desktopAppRequired) {
                              // Copy PIN and opendidac:// URL when desktop app is required
                              const pinText = evaluation.pin
                                ? `PIN: ${evaluation.pin}`
                                : ''
                              const urlText = getStudentEntryLink(
                                evaluation.id,
                                true,
                              )
                              await navigator.clipboard.writeText(
                                pinText
                                  ? `${pinText}\nURL: ${urlText}`
                                  : `URL: ${urlText}`,
                              )
                            } else {
                              // Copy regular web URL
                              await navigator.clipboard.writeText(
                                `URL: ${getStudentEntryLink(evaluation.id)}`,
                              )
                            }
                          })()
                        }}
                      >
                        <Image
                          alt="Copy link"
                          src="/svg/icons/link.svg"
                          width="18"
                          height="18"
                        />
                      </IconButton>
                    </Tooltip>
                  )}
                <Link
                  href={`/${groupScope}/evaluations/${evaluation.id}/analytics`}
                  passHref
                  key="analytics"
                >
                  <Tooltip title="Open Analytics Page">
                    <IconButton
                      component="span"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Image
                        alt="Analytics"
                        src="/svg/icons/analytics.svg"
                        width="18"
                        height="18"
                      />
                    </IconButton>
                  </Tooltip>
                </Link>
                {evaluation.status === EvaluationStatus.ACTIVE && (
                  <Tooltip title="Deactivate evaluation" key="deactivate">
                    <IconButton onClick={(ev) => onDelete(ev, evaluation)}>
                      <Image
                        alt="Deactivate evaluation"
                        src="/svg/icons/archive.svg"
                        width="18"
                        height="18"
                      />
                    </IconButton>
                  </Tooltip>
                )}

                {evaluation.status === EvaluationStatus.INACTIVE && (
                  <Tooltip title="Delete definitively" key="archive">
                    <IconButton onClick={(ev) => onDelete(ev, evaluation)}>
                      <Image
                        alt="Delete definitively"
                        src="/svg/icons/delete.svg"
                        width="18"
                        height="18"
                      />
                    </IconButton>
                  </Tooltip>
                )}
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
            groupBy: 'phase',
            option: 'Phase',
            type: 'element',
            renderLabel: (row) => (
              <Box>
                <DisplayPhase phase={row.label} />
              </Box>
            ),
          },
        ]}
      />
      <AddEvaluationDialog
        open={addDialogOpen}
        existingEvaluations={evaluations}
        onClose={() => setAddDialogOpen(false)}
        groupScope={groupScope}
      />
    </Box>
  )
}

export default ListEvaluation
