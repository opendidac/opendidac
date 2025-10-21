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
import useSWR from 'swr'
import React, { useCallback, useRef, useState } from 'react'
import { create, del, update } from './crud'
import { Button, IconButton, Stack } from '@mui/material'
import FileEditor from '../../FileEditor'
import Image from 'next/image'

import languages from '@/code/languages.json'
import CodeCheck from '../CodeCheck'
import Loading from '@/components/feedback/Loading'
import { fetcher } from '@/code/utils'
import ScrollContainer from '@/components/layout/ScrollContainer'
import { useDebouncedCallback } from 'use-debounce'
import BottomCollapsiblePanel from '@/components/layout/utils/BottomCollapsiblePanel'

const environments = languages.environments
const SolutionFilesManager = ({
  groupScope,
  questionId,
  language,
  onUpdate,
}) => {
  const filesRef = useRef()

  const {
    data: codeToSolutionFiles,
    mutate,
    error,
  } = useSWR(
    `/api/${groupScope}/questions/${questionId}/code/code-writing/files/solution`,
    groupScope && questionId ? fetcher : null,
    { revalidateOnFocus: false },
  )

  const [lockCodeCheck, setLockCodeCheck] = useState(false)

  const onAddFile = useCallback(async () => {
    const extension = environments.find(
      (env) => env.language === language,
    ).extension
    const path = `/src/file${codeToSolutionFiles?.length || ''}.${extension}`

    await create('solution', groupScope, questionId, {
      file: {
        path,
        content: '',
      },
    })
      .then(async (newFile) => {
        await mutate([...codeToSolutionFiles, newFile])
        // scroll to the bottom of the files list
        filesRef.current.scrollTop = filesRef.current.scrollHeight
      })
      .finally(() => {
        onUpdate && onUpdate()
      })
  }, [groupScope, questionId, codeToSolutionFiles, mutate, language, onUpdate])

  const onFileUpdate = useCallback(
    async (file) => {
      setLockCodeCheck(true)
      await update('solution', groupScope, questionId, file)
      setLockCodeCheck(false)
      onUpdate && onUpdate()
    },
    [groupScope, questionId, onUpdate],
  )

  const debouncedOnFileChange = useDebouncedCallback(onFileUpdate, 500)

  const onDeleteFile = useCallback(
    async (codeToSolutionFile) => {
      await del('solution', groupScope, questionId, codeToSolutionFile)
        .then(async (msg) => {
          await mutate(
            codeToSolutionFiles.filter(
              (file) => file.id !== codeToSolutionFile.id,
            ),
          )
        })
        .finally(() => {
          onUpdate && onUpdate()
        })
    },
    [groupScope, questionId, mutate, codeToSolutionFiles, onUpdate],
  )

  return (
    <Loading loading={!codeToSolutionFiles} errors={[error]}>
      {codeToSolutionFiles && (
        <BottomCollapsiblePanel
          bottomPanel={
            <CodeCheck
              lockCodeCheck={lockCodeCheck}
              codeCheckAction={() =>
                fetch(`/api/sandbox/${questionId}/code-writing/solution`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                })
              }
            />
          }
        >
          <Button onClick={onAddFile}>Add File</Button>
          <ScrollContainer ref={filesRef} pb={24}>
            {codeToSolutionFiles.map((codeToSolutionFile, index) => (
              <FileEditor
                key={index}
                file={codeToSolutionFile.file}
                onChange={(file) => {
                  setLockCodeCheck(true)
                  debouncedOnFileChange({
                    ...codeToSolutionFile,
                    file,
                  })
                }}
                secondaryActions={
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      key="delete-file"
                      onClick={async () =>
                        await onDeleteFile(codeToSolutionFile)
                      }
                    >
                      <Image
                        alt="Delete"
                        src="/svg/icons/delete.svg"
                        width="18"
                        height="18"
                      />
                    </IconButton>
                  </Stack>
                }
              />
            ))}
          </ScrollContainer>
        </BottomCollapsiblePanel>
      )}
    </Loading>
  )
}

export default SolutionFilesManager
