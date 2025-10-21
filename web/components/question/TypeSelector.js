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
import { toArray as typesToArray } from './types.js'
import { MenuItem, Stack, Typography } from '@mui/material'
import DropDown from '../input/DropDown'
import React from 'react'

const types = typesToArray()

const TypeSelector = ({ type, onChange }) => {
  return (
    <DropDown
      id="question"
      name="Type"
      defaultValue={type}
      minWidth="160px"
      onChange={onChange}
    >
      {types?.map(({ value, label }) => (
        <MenuItem key={value} value={value}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption">{label}</Typography>
          </Stack>
        </MenuItem>
      ))}
    </DropDown>
  )
}
export default TypeSelector
