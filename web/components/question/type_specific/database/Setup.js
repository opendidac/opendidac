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
import React, { useCallback, useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Stack, Typography } from '@mui/material'
import DockerImageField from '@/components/input/DockerImageField'

const Setup = ({ groupScope, questionId, database, onChange }) => {
  const [image, setImage] = useState(database?.image)

  useEffect(() => {
    setImage(database?.image)
  }, [database])

  const onChangeImage = useCallback(
    async (database) => {
      await fetch(`/api/${groupScope}/questions/${questionId}/database`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(database),
      }).then((res) => res.json())
    },
    [groupScope, questionId],
  )

  const debouncedOnChange = useDebouncedCallback(onChangeImage, 500)

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Sandbox</Typography>

      <DockerImageField
        image={image}
        onChange={(newImage) => {
          setImage(newImage)
          const newDatabase = {
            ...database,
            image: newImage,
          }
          onChange && onChange(newDatabase)
          debouncedOnChange(newDatabase)
        }}
      />
    </Stack>
  )
}

export default Setup
