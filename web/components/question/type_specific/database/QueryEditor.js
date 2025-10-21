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
import { Chip, Stack, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import InlineMonacoEditor from '../../../input/InlineMonacoEditor'

const QueryEditor = ({
  readOnly = false,
  hidden = false,
  query,
  onChange,
  headerLeft,
}) => {
  const [content, setContent] = useState(query.content)

  useEffect(() => {
    setContent(query.content)
  }, [query])

  return (
    <Stack>
      <Stack
        direction="row"
        position="sticky"
        top={0}
        spacing={1}
        p={2}
        alignItems="center"
        justifyContent="flex-start"
        zIndex={1}
        bgcolor="white"
      >
        <Stack
          direction={'row'}
          spacing={1}
          alignItems={'center'}
          justifyContent={'space-between'}
          width={'100%'}
        >
          <Stack
            direction={'row'}
            flex={1}
            alignItems={'center'}
            justifyContent={'flex-start'}
            spacing={1}
          >
            <Stack direction={'column'} spacing={1}>
              <Stack direction={'row'} spacing={1} alignItems={'center'}>
                {headerLeft}
                <Typography variant="body1">{`#${query.order} ${
                  query.title || 'Untitled'
                }`}</Typography>
              </Stack>
              {query.description && (
                <Typography variant="body2">{query.description}</Typography>
              )}
            </Stack>
          </Stack>
          {query.testQuery && (
            <Chip
              size={'small'}
              variant={'outlined'}
              color={'warning'}
              label={'Evaluated'}
            />
          )}
        </Stack>
      </Stack>
      {!hidden && (
        <InlineMonacoEditor
          code={content}
          language={'sql'}
          readOnly={readOnly}
          onChange={(sql) => {
            if (sql === query.content) return
            setContent(sql)
            onChange({
              ...query,
              content: sql,
            })
          }}
        />
      )}
    </Stack>
  )
}

export default QueryEditor
