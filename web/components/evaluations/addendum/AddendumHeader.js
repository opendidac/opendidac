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
import { Button, Stack, Typography } from '@mui/material'
import { useBottomPanel } from '@/context/BottomPanelContext'
import BottomPanelHeader from '@/components/layout/utils/BottomPanelHeader'
import StatusDisplay from '@/components/feedback/StatusDisplay'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'
import InfoIcon from '@mui/icons-material/Info'
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined'

const AddendumHeader = ({ addendum, readOnly }) => {
  const { openPanel } = useBottomPanel()

  return (
    <BottomPanelHeader showOpenButton={addendum?.length > 0}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
      >
        {addendum ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">Addendum</Typography>
            <StatusDisplay status={'SUCCESS'} />
            {readOnly && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <InfoIcon fontSize="small" color="info" />
                <Typography variant="caption" color="text.secondary">
                  Additional group feedback
                </Typography>
              </Stack>
            )}
          </Stack>
        ) : (
          !readOnly && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                size={'small'}
                onClick={openPanel}
                startIcon={<NoteAddOutlinedIcon />}
              >
                <Typography variant="caption">Add new addendum</Typography>
              </Button>
              <UserHelpPopper label="What is an addendum?">
                <Typography>
                  An addendum is a post-grading note that provides students with
                  additional information about the solution for this question.
                </Typography>
                <Typography>
                  It serves as a shared clarification or explanation, helping
                  students understand common mistakes, grading criteria, or key
                  takeaways from the assessment.
                </Typography>
                <Typography>
                  Since the same addendum is visible to all students, it acts as
                  collective feedback rather than individual comments.
                </Typography>
              </UserHelpPopper>
            </Stack>
          )
        )}
      </Stack>
    </BottomPanelHeader>
  )
}

export default AddendumHeader
