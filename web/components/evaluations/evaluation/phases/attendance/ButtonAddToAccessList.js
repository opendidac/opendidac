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
import DialogFeedback from '@/components/feedback/DialogFeedback'
import { Button, Typography } from '@mui/material'
import Image from 'next/image'
import { useCallback, useState } from 'react'

const ButtonAddToAccessList = ({
  groupScope,
  evaluationId,
  studentEmail,
  onStudentAllowed,
}) => {
  const [open, setOpen] = useState(false)

  const onAddToAccessList = useCallback(async () => {
    await fetch(
      `/api/${groupScope}/evaluations/${evaluationId}/students/allow`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ studentEmail }),
      },
    ).then((res) => {
      if (res.ok) {
        setOpen(false)
        onStudentAllowed(studentEmail)
      }
    })
  }, [groupScope, evaluationId, studentEmail, onStudentAllowed])

  return (
    <>
      <Button
        key="edit"
        color="info"
        startIcon={
          <Image
            alt="Remove From Collection"
            src="/svg/icons/enter.svg"
            width="24"
            height="24"
          />
        }
        onClick={() => {
          setOpen(true)
        }}
      >
        Add to access list
      </Button>
      <DialogFeedback
        open={open}
        title={'Allow the student to access the evaluation'}
        content={
          <Typography variant={'body1'}>
            Are you sure you want to add {studentEmail} to the access list?
          </Typography>
        }
        onClose={() => {
          setOpen(false)
        }}
        onConfirm={() => {
          onAddToAccessList()
        }}
      />
    </>
  )
}

export default ButtonAddToAccessList
