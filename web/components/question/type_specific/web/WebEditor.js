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

import { Stack, Typography } from '@mui/material'
import Image from 'next/image'
import InlineMonacoEditor from '../../../input/InlineMonacoEditor'
import { useTheme } from '@emotion/react'
import { useEffect, useRef } from 'react'

const WebEditor = ({
  id = 'web',
  title,
  readOnly = false,
  web: initial,
  onChange,
}) => {
  // Only fields the user touched; untouched fields fall back to the latest
  // server value when assembling the onChange payload.
  const edits = useRef({})

  useEffect(() => {
    edits.current = {}
  }, [id])

  const handleChange = (field, value) => {
    edits.current[field] = value
    if (onChange) {
      onChange({
        html: edits.current.html ?? initial?.html ?? '',
        css: edits.current.css ?? initial?.css ?? '',
        js: edits.current.js ?? initial?.js ?? '',
      })
    }
  }

  return (
    <Stack spacing={0} pt={0} position={'relative'} pb={24}>
      {title && (
        <Stack p={1}>
          <Typography variant="body1">{title}</Typography>
        </Stack>
      )}

      <WebEditorInput
        id={`${id}-html`}
        language={'html'}
        code={initial?.html || ''}
        readOnly={readOnly}
        onChange={(code) => handleChange('html', code)}
      />
      <WebEditorInput
        id={`${id}-css`}
        language={'css'}
        code={initial?.css || ''}
        readOnly={readOnly}
        onChange={(code) => handleChange('css', code)}
      />
      <WebEditorInput
        id={`${id}-js`}
        language={'javascript'}
        code={initial?.js || ''}
        readOnly={readOnly}
        onChange={(code) => handleChange('js', code)}
      />
    </Stack>
  )
}

const WebEditorInput = ({ id, language, code, readOnly, onChange }) => {
  const theme = useTheme()

  return (
    <Stack spacing={1} position={'relative'}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        p={1}
        pt={2}
        position={'sticky'}
        top={0}
        zIndex={1}
        bgcolor={theme.palette.background.paper}
      >
        <Image
          src={`/svg/languages/${language}.svg`}
          alt={language}
          width={24}
          height={24}
        />
        <Typography variant="button">{language}</Typography>
      </Stack>
      <InlineMonacoEditor
        contentKey={`web:${id}`}
        defaultValue={code}
        language={language}
        readOnly={readOnly}
        onChange={onChange}
      />
    </Stack>
  )
}

export default WebEditor
