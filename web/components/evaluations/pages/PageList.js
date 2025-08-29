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
import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/router'
import { EvaluationPhase, EvaluationStatus, Role } from '@prisma/client'
import { Typography, Stack, Tab } from '@mui/material'
import LayoutMain from '@/components/layout/LayoutMain'

import { useSnackbar } from '@/context/SnackbarContext'

import { fetcher } from '@/code/utils'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import DialogFeedback from '@/components/feedback/DialogFeedback'
import Authorization from '@/components/security/Authorization'

import MainMenu from '@/components/layout/MainMenu'

import Loading from '@/components/feedback/Loading'

import ListEvaluation from '../list/ListEvaluation'

const Evaluations = () => {
  const router = useRouter()

  const { groupScope } = router.query

  const { show: showSnackbar } = useSnackbar()
  const [selected, setSelected] = useState(null)

  const { data, error, mutate } = useSWR(
    `/api/${groupScope}/evaluations`,
    groupScope ? fetcher : null,
  )

  const [tab, setTab] = useState(EvaluationStatus.ACTIVE)
  const [evaluations, setEvaluations] = useState(data)

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [endOfDraftDialogOpen, setEndOfDraftDialogOpen] = useState(false)

  useEffect(() => {
    if (data) {
      setEvaluations(data)
    }
  }, [data])

  const endDraftPhase = useCallback(async () => {
    setEndOfDraftDialogOpen(false)
    await fetch(`/api/${groupScope}/evaluations/${selected.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ phase: EvaluationPhase.IN_PROGRESS }),
    })
    await router.push(`/${groupScope}/evaluations/${selected.id}/in-progress`)
  }, [groupScope, router, selected])

  const changeEvaluationStatus = useCallback(async () => {
    await fetch(`/api/${groupScope}/evaluations/${selected.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: EvaluationStatus.INACTIVE }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then((_) => {
        setEvaluations(
          evaluations.map((evaluation) => {
            if (evaluation.id === selected.id) {
              evaluation.status = EvaluationStatus.INACTIVE
            }
            return evaluation
          }),
        )
        showSnackbar('evaluation set to inactive', 'success')
      })
      .catch((_) => {
        showSnackbar('Error setting evaluation to inactive', 'error')
      })
    setSelected(null)
  }, [groupScope, evaluations, selected, showSnackbar])

  const deleteEvaluation = useCallback(async () => {
    await fetch(`/api/${groupScope}/evaluations/${selected.id}`, {
      method: 'DELETE',
    })
      .then((_) => {
        setEvaluations(
          evaluations.filter((evaluation) => evaluation.id !== selected.id),
        )
        showSnackbar('evaluation deleted', 'success')
      })
      .catch((_) => {
        showSnackbar('Error deleting collections session', 'error')
      })
    setSelected(null)
  }, [groupScope, evaluations, selected, showSnackbar])

  return (
    <Authorization allowRoles={[Role.PROFESSOR]}>
      <Loading loading={!evaluations} errors={[error]}>
        <TabContext value={tab}>
          <LayoutMain
            header={<MainMenu />}
            subheader={
              <Stack
                direction="row"
                spacing={2}
                justifyContent="space-between"
                sx={{ pr: 2 }}
              >
                <TabList
                  onChange={(e, v) => setTab(v)}
                  aria-label="simple tabs example"
                >
                  <Tab label="Active" value={EvaluationStatus.ACTIVE} />
                  <Tab label="Inactive" value={EvaluationStatus.INACTIVE} />
                </TabList>
              </Stack>
            }
          >
            <ListEvaluation
              groupScope={groupScope}
              evaluations={
                evaluations?.filter(
                  (evaluation) => evaluation.status === tab,
                ) || []
              }
              onStart={(ev, session) => {
                ev.stopPropagation()
                ev.preventDefault()
                setSelected(session)
                setEndOfDraftDialogOpen(true)
              }}
              onDelete={(ev, evaluation) => {
                ev.preventDefault()
                ev.stopPropagation()
                setSelected(evaluation)
                if (evaluation.status === EvaluationStatus.INACTIVE) {
                  setDeleteDialogOpen(true)
                } else {
                  setArchiveDialogOpen(true)
                }
              }}
            />
          </LayoutMain>
          <DialogFeedback
            open={archiveDialogOpen}
            title="Set evaluation to inactive"
            content="Are you sure you want to set this evaluation to inactive?"
            onClose={() => setArchiveDialogOpen(false)}
            onConfirm={changeEvaluationStatus}
          />
          <DialogFeedback
            open={deleteDialogOpen}
            title="Delete this evaluation"
            content="Are you sure you want to delete this evaluation?"
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={deleteEvaluation}
          />
          <DialogFeedback
            open={endOfDraftDialogOpen}
            title="End of DRAFT phase"
            content={
              <>
                <Typography variant="body1" gutterBottom>
                  This evaluation is about to go to the <b>in-progress</b>{' '}
                  phase.
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Registered students will be able to start with their
                  evaluation.
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Late student registrations will still be possible.
                </Typography>
                {selected &&
                  (selected.durationHours > 0 || selected.durationMins > 0) && (
                    <Typography variant="body1" gutterBottom>
                      End time estimated at{' '}
                      <b>
                        {new Date(
                          Date.now() +
                            selected.durationHours * 3600000 +
                            selected.durationMins * 60000,
                        ).toLocaleTimeString()}
                      </b>
                      .
                    </Typography>
                  )}
                <Typography variant="button" gutterBottom>
                  {' '}
                  Are you sure you want to continue?`
                </Typography>
              </>
            }
            onClose={() => setEndOfDraftDialogOpen(false)}
            onConfirm={endDraftPhase}
          />
        </TabContext>
      </Loading>
    </Authorization>
  )
}

export default Evaluations
