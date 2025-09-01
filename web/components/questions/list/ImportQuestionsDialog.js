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
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
  styled,
} from '@mui/material'
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material'
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
  const [importProgress, setImportProgress] = useState(0)
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

        // Validate the JSON structure
        const questionsToImport = extractQuestions(jsonData)
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

  const extractQuestions = (jsonData) => {
    // Handle different JSON formats
    if (Array.isArray(jsonData)) {
      return jsonData.filter((item) => item.schema === 'opendidac.question@1')
    }

    if (jsonData.questions && Array.isArray(jsonData.questions)) {
      return jsonData.questions.filter(
        (item) => item.schema === 'opendidac.question@1',
      )
    }

    if (jsonData.schema === 'opendidac.question@1') {
      return [jsonData]
    }

    return []
  }

  const handleImport = async () => {
    if (!parsedData || !groupScope) return

    setImporting(true)
    setImportProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch(`/api/${groupScope}/questions/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(parsedData.original),
      })

      clearInterval(progressInterval)
      setImportProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const result = await response.json()

      // Success
      setTimeout(() => {
        onImportSuccess?.(result)
        handleClose()
      }, 500) // Small delay to show 100% progress
    } catch (error) {
      console.error('Import error:', error)
      setParseError(`Import failed: ${error.message}`)
      setImportProgress(0)
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
    setImportProgress(0)
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

          {/* Import Progress */}
          {importing && (
            <Box>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <CircularProgress size={20} />
                <Typography variant="body2">
                  Importing questions... {importProgress}%
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={importProgress} />
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={importing}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={!parsedData || !!parseError || importing}
        >
          {importing
            ? 'Importing...'
            : `Import ${parsedData?.count || 0} Question${parsedData?.count !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ImportQuestionsDialog
