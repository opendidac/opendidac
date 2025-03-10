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
import { Stack, Typography } from '@mui/material'
import MarkdownEditor from '@/components/input/markdown/MarkdownEditor'
import MarkdownViewer from '@/components/input/markdown/MarkdownViewer'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'
import InfoIcon from '@mui/icons-material/Info'
import { useTheme } from '@emotion/react'
import { useSnackbar } from '@/context/SnackbarContext'
import { useCallback, useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Box } from '@mui/system'

const Addendum = ({
  groupScope,
  evaluationId,
  evaluationToQuestion,
  readOnly,
  onAddendumChanged,
}) => {
  const theme = useTheme()

  const { show: showSnackbar } = useSnackbar()
  const [addendum, setAddendum] = useState(evaluationToQuestion?.addendum || '')

  useEffect(() => {
    setAddendum(evaluationToQuestion?.addendum || '')
  }, [evaluationToQuestion])

  const debounceAddendumChange = useDebouncedCallback(
    useCallback(
      async (addendum) => {
        if (!evaluationToQuestion) return

        try {
          const response = await fetch(
            `/api/${groupScope}/evaluations/${evaluationId}/questions/${evaluationToQuestion.questionId}/`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ addendum }),
            },
          )

          if (!response.ok) {
            throw new Error('Failed to update addendum')
          }
          // Call parent callback only after successful API update
          onAddendumChanged?.(addendum)
        } catch (error) {
          showSnackbar('Failed to save addendum', 'error')
        }
      },
      [
        groupScope,
        evaluationId,
        showSnackbar,
        evaluationToQuestion,
        onAddendumChanged,
      ],
    ),
    500,
  )

  const handleAddendumChange = useCallback(
    (value) => {
      setAddendum(value)
      debounceAddendumChange(value)
    },
    [debounceAddendumChange],
  )

  // Return null if in readonly mode and no addendum
  if (readOnly && (!addendum || addendum.length === 0)) {
    return null
  }

  return (
    <Stack
      pl={1}
      pr={1}
      my={1}
      spacing={2}
      borderTop={`1px solid ${theme.palette.divider}`}
      borderBottom={`1px solid ${theme.palette.divider}`}
      bgcolor={'background.paper'}
      {...(!readOnly && {
        minHeight: '400px',
        height: '100%',
      })}
    >
      <AddendumHeader readOnly={readOnly} />
      {readOnly ? (
        <Box pb={1}>
          <MarkdownViewer content={addendum} />
        </Box>
      ) : (
        <MarkdownEditor
          groupScope={groupScope}
          readOnly={readOnly}
          rawContent={addendum}
          onChange={handleAddendumChange}
        />
      )}
    </Stack>
  )
}

const AddendumHeader = ({ readOnly }) => {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography variant="h6">Addendum</Typography>
      {readOnly ? (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <InfoIcon fontSize="small" color="info" />
          <Typography variant="caption" color="text.secondary">
            Additional group feedback
          </Typography>
        </Stack>
      ) : (
        <UserHelpPopper label="What is an addendum?">
          <Typography>
            An addendum is a post-grading note that provides students with
            additional information about the solution for this question.
          </Typography>
          <Typography>
            It serves as a shared clarification or explanation, helping students
            understand common mistakes, grading criteria, or key takeaways from
            the assessment.
          </Typography>
          <Typography>
            Since the same addendum is visible to all students, it acts as
            collective feedback rather than individual comments.
          </Typography>
        </UserHelpPopper>
      )}
    </Stack>
  )
}

export default Addendum
