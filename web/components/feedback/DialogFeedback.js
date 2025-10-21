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
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
const DialogFeedback = ({
  open,
  title,
  content,
  hideCancel = false,
  confirmButtonProps = {},
  onClose,
  onConfirm,
}) => {
  const handleCancel = () => {
    onClose && onClose()
  }

  const handleConfirm = () => {
    onConfirm && onConfirm()
    onClose && onClose()
  }

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        maxWidth="width"
      >
        <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
        <DialogContent>{content}</DialogContent>
        <DialogActions>
          {!hideCancel && <Button onClick={handleCancel}>Cancel</Button>}

          {onConfirm && (
            <Button
              variant="contained"
              color="success"
              onClick={handleConfirm}
              autoFocus
              {...confirmButtonProps}
            >
              Confirm
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default DialogFeedback
