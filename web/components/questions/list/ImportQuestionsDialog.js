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
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  styled,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import {
  CloudUpload as CloudUploadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import { useState, useRef } from 'react'

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
})

const ImportQuestionsDialog = ({
  open,
  onClose,
  onImportSuccess,
  groupScope,
}) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Reset states
    setSelectedFile(file)
    setParsedData(null)
    setParseError(null)

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      setParseError('Please select a JSON file')
      return
    }

    // Read and parse the file
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result)
        e
        const questionsToImport = jsonData.questions
        if (questionsToImport.length === 0) {
          setParseError('No valid questions found in the file')
          return
        }

        setParsedData({
          original: jsonData,
          questions: questionsToImport,
          count: questionsToImport.length,
        })
      } catch (error) {
        setParseError(`Invalid JSON file: ${error.message}`)
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!parsedData || !groupScope) return

    setImporting(true)

    try {
      const response = await fetch(`/api/${groupScope}/questions/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(parsedData.original),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const result = await response.json()

      // Success
      onImportSuccess?.(result)
      handleClose()
    } catch (error) {
      console.error('Import error:', error)
      setParseError(`Import failed: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    if (importing) return // Prevent closing during import

    setSelectedFile(null)
    setParsedData(null)
    setParseError(null)
    setImporting(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const getQuestionSummary = () => {
    if (!parsedData) return null

    const typeCount = parsedData.questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1
      return acc
    }, {})

    return Object.entries(typeCount)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ')
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={importing}
    >
      <DialogTitle>Import Questions</DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* File Selection */}
          <Box>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              fullWidth
              disabled={importing}
              sx={{ mb: 2 }}
            >
              Select JSON file
              <VisuallyHiddenInput
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
              />
            </Button>

            {selectedFile && (
              <Typography variant="body2" color="text.secondary">
                Selected: {selectedFile.name} (
                {(selectedFile.size / 1024).toFixed(1)} KB)
              </Typography>
            )}
          </Box>

          {/* Parse Error */}
          {parseError && <Alert severity="error">{parseError}</Alert>}

          {/* Parsed Data Preview */}
          {parsedData && !parseError && (
            <Alert severity="info">
              <Typography variant="body2">
                Found {parsedData.count} question
                {parsedData.count > 1 ? 's' : ''} to import:
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                {getQuestionSummary()}
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={importing}>
          Cancel
        </Button>
        <LoadingButton
          onClick={handleImport}
          variant="contained"
          disabled={!parsedData || !!parseError}
          loading={importing}
          startIcon={<UploadIcon />}
          loadingPosition="start"
          sx={{
            minWidth: '140px',
          }}
        >
          {`Import ${parsedData?.count || 0} Question${parsedData?.count !== 1 ? 's' : ''}`}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}

export default ImportQuestionsDialog
