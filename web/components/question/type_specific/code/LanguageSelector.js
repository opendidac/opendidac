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
import React from 'react'
import { MenuItem, Stack, Typography } from '@mui/material'
import DropDown from '@/components/input/DropDown'
import languages from '@/code/languages.json'
import LanguageIcon from './LanguageIcon'

const environments = languages.environments

const LanguageSelector = ({ language, onChange }) => {
  return (
    <DropDown
      id="language"
      name="Language"
      defaultValue={language}
      minWidth="140px"
      onChange={onChange}
    >
      {environments.map((env, i) => (
        <MenuItem key={i} value={env.language}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LanguageIcon language={env.language} size={22} />
            <Typography variant="body1">{env.label}</Typography>
          </Stack>
        </MenuItem>
      ))}
    </DropDown>
  )
}

export default LanguageSelector
