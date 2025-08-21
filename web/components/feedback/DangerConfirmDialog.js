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
import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'

const DangerConfirmDialog = ({
  open,
  title,
  content,
  width = 'md',
  hideCancel = false,
  confirmButtonProps = {},
  onClose,
  onConfirm,
  prompt = 'Please type the confirmation text to proceed.',
  expectedValue = 'i understand the consequences',
  helperText,
}) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) setValue('') // reset when dialog is opened
  }, [open])

  const isValid = typeof expectedValue === 'string' && value === expectedValue

  const handleCancel = () => {
    onClose && onClose()
  }

  const handleConfirm = async () => {
    if (!isValid || !onConfirm) return
    await Promise.resolve(onConfirm())
    onClose && onClose()
  }

  const {
    disabled: confirmDisabled,
    children: confirmChildren,
    ...restConfirmButtonProps
  } = confirmButtonProps || {}

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      aria-labelledby="danger-dialog-title"
      aria-describedby="danger-dialog-description"
      maxWidth={width}
      fullWidth
    >
      <DialogTitle id="danger-dialog-title">{title}</DialogTitle>

      <DialogContent id="danger-dialog-description">
        {content}

        <div style={{ marginTop: 16 }}>
          {prompt && (
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              {prompt}{' '}
              {typeof expectedValue === 'string' && (
                <>
                  Type <strong>{expectedValue}</strong> to confirm.
                </>
              )}
            </Typography>
          )}

          <TextField
            fullWidth
            autoFocus
            label="Confirmation"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            error={value.length > 0 && !isValid}
            helperText={
              helperText ??
              (value.length > 0 && !isValid ? 'Value does not match.' : ' ')
            }
          />
        </div>
      </DialogContent>

      <DialogActions>
        {!hideCancel && <Button onClick={handleCancel}>Cancel</Button>}

        {onConfirm && (
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirm}
            autoFocus
            {...restConfirmButtonProps}
            disabled={!isValid || !!confirmDisabled}
          >
            {confirmChildren || 'Confirm'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default DangerConfirmDialog
