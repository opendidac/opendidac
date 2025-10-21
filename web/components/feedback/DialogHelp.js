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
import * as React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

const DialogHelp = ({ title, content }) => {
  return (
    <Dialog
      open={true}
      aria-labelledby="help-dialog-title"
      aria-describedby="help-dialog-description"
    >
      <DialogTitle id="help-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="help-dialog-description">
          {content}
        </DialogContentText>
      </DialogContent>
    </Dialog>
  )
}

export default DialogHelp
