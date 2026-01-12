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
import { useCtrlState } from '@/hooks/useCtrlState'

const WebEditor = ({
  id = 'web',
  title,
  readOnly = false,
  web: initial,
  onChange,
}) => {
  const {
    state: html,
    setState: setHtml,
    get: getHtml,
  } = useCtrlState(initial?.html || '', `${id}-html`)

  const {
    state: css,
    setState: setCss,
    get: getCss,
  } = useCtrlState(initial?.css || '', `${id}-css`)

  const {
    state: js,
    setState: setJs,
    get: getJs,
  } = useCtrlState(initial?.js || '', `${id}-js`)

  const handleChange = (field, value) => {
    if (field === 'html') {
      setHtml(value)
    } else if (field === 'css') {
      setCss(value)
    } else if (field === 'js') {
      setJs(value)
    }

    if (onChange) {
      const newWeb = {
        html: field === 'html' ? value : getHtml(),
        css: field === 'css' ? value : getCss(),
        js: field === 'js' ? value : getJs(),
      }
      onChange(newWeb)
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
        code={html}
        readOnly={readOnly}
        onChange={(code) => handleChange('html', code)}
      />
      <WebEditorInput
        id={`${id}-css`}
        language={'css'}
        code={css}
        readOnly={readOnly}
        onChange={(code) => handleChange('css', code)}
      />
      <WebEditorInput
        id={`${id}-js`}
        language={'javascript'}
        code={js}
        readOnly={readOnly}
        onChange={(code) => handleChange('js', code)}
      />
    </Stack>
  )
}

const WebEditorInput = ({
  id,
  language,
  code: initial,
  readOnly,
  onChange,
}) => {
  const theme = useTheme()

  const { state: code, setState: setCode } = useCtrlState(initial || '', id)

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
        width="100%"
        options={{ readOnly }}
        language={language}
        code={code}
        readOnly={readOnly}
        onChange={(content) => {
          setCode(content)
          onChange(content)
        }}
      />
    </Stack>
  )
}

export default WebEditor
