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
import { languageBasedOnPathExtension } from '@/code/utils'
import DialogFeedback from '@/components/feedback/DialogFeedback'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'
import DropdownSelector from '@/components/input/DropdownSelector'
import InlineDiffEditor from '@/components/input/InlineDiffEditor '
import InlineMonacoEditor from '@/components/input/InlineMonacoEditor'
import ResizePanel from '@/components/layout/utils/ResizePanel'
import { useTheme } from '@emotion/react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

const { useAnnotation } = require('@/context/AnnotationContext')

const viewModes = [
  { value: 'ANNOTATED', label: 'Annotated' },
  { value: 'ORIGINAL', label: 'Original' },
  { value: 'DIFF', label: 'Diff' },
]

const ViewModeSelector = ({ currentViewMode, onViewModeChange }) => {
  // A function to format the label shown on the button
  const formatLabel = (option) => option.label

  return (
    <Box zIndex={100}>
      <DropdownSelector
        size="small"
        label={formatLabel}
        color="info"
        options={viewModes}
        variant="outlined" // Change as needed: 'outlined', 'contained', etc.
        onSelect={onViewModeChange}
        value={currentViewMode}
      />
    </Box>
  )
}

const AnnotateToolbar = ({
  readOnly,
  viewMode,
  setViewMode,
  state,
  onDiscard,
}) => {
  const theme = useTheme()
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)

  return (
    state === 'ANNOTATED' && (
      <Stack
        direction="row"
        alignItems="center"
        bgcolor={theme.palette.background.paper}
        zIndex={100}
        spacing={1}
      >
        <ViewModeSelector
          currentViewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        {!readOnly && (
          <Button
            variant="text"
            size="small"
            onClick={(ev) => {
              ev.stopPropagation()
              setDiscardDialogOpen(true)
            }}
          >
            Discard
          </Button>
        )}
        <DialogFeedback
          open={discardDialogOpen}
          title="Discard Annotation"
          content="Are you sure you want to discard this annotation?"
          onConfirm={() => {
            onDiscard()
            setViewMode('ANNOTATED')
            setDiscardDialogOpen(false)
          }}
          onClose={() => setDiscardDialogOpen(false)}
        />
      </Stack>
    )
  )
}

const StudentFileAnnotationWrapper = ({ file: original }) => {
  const theme = useTheme()

  const { readOnly, state, annotation, change, discard } = useAnnotation()

  const hasAnnotation = annotation?.content !== undefined
  const defaultViewMode = readOnly && hasAnnotation ? 'DIFF' : 'ANNOTATED'

  const [viewMode, setViewMode] = useState(defaultViewMode)

  useEffect(() => {
    setViewMode(defaultViewMode)
  }, [original, defaultViewMode])

  const onChange = (content) => {
    change(content)
  }

  const file = {
    ...original,
    content: hasAnnotation ? annotation.content : original.content,
  }

  const language = languageBasedOnPathExtension(file?.path)

  return (
    <Stack position={'relative'}>
      <Stack
        position={'sticky'}
        top={0}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        bgcolor={theme.palette.background.paper}
        zIndex={1000}
        height={50}
      >
        <Box flex={1} pl={1}>
          <Typography variant="body1"> {file.path} </Typography>
        </Box>
        <AnnotateToolbar
          readOnly={readOnly}
          viewMode={viewMode}
          setViewMode={setViewMode}
          state={state}
          onDiscard={discard}
        />
        {!readOnly && state === 'NOT_ANNOTATED' && <HoverInfoMessage />}
      </Stack>
      <ResizePanel
        leftPanel={
          viewMode === 'ANNOTATED' || viewMode === 'ORIGINAL' ? (
            <InlineMonacoEditor
              code={file.content}
              readOnly={readOnly}
              onChange={onChange}
              language={language}
            />
          ) : (
            <InlineDiffEditor
              readOnly
              original={original.content}
              modified={file.content}
              language={language}
              editorOptions={{
                readOnly: true,
                renderSideBySide: true,
                enableSplitViewResizing: true,
              }}
            />
          )
        }
        rightPanel={
          <InlineMonacoEditor
            code={original.content}
            readOnly
            language={language}
          />
        }
        rightWidth={hasAnnotation && viewMode === 'ORIGINAL' ? 40 : 0}
        hideHandle={!hasAnnotation || viewMode !== 'ORIGINAL'}
      />
    </Stack>
  )
}

const HoverInfoMessage = () => {
  return (
    <Box pr={1}>
      <UserHelpPopper label={'Start editing to provide feedback'}>
        <Typography variant={'body1'}>
          Feel free to annotate the student&apos;s answer with your feedback.
        </Typography>
        <Typography variant={'body1'}>
          You can add comments to the student&apos;s proposal or even suggest
          fixes.
        </Typography>
        <Typography variant={'body1'}>
          The original answer will be preserved.
        </Typography>
        <Typography variant={'body1'}>
          Your feedback will be given to the student in the form of a code diff.
        </Typography>
      </UserHelpPopper>
    </Box>
  )
}

export default StudentFileAnnotationWrapper
