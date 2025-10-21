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
import { Stack, Typography, Tooltip } from '@mui/material'
import Image from 'next/image'
import React from 'react'
import languages from '@/code/languages.json'
import { CodeQuestionType } from '@prisma/client'

const codeTypeToIcon = {
  [CodeQuestionType.codeWriting]: {
    icon: languages['codeWritingIcon'],
    label: 'Code Writing',
  },
  [CodeQuestionType.codeReading]: {
    icon: languages['codeReadingIcon'],
    label: 'Code Reading',
  },
}

const CodeQuestionTypeIcon = ({ codeType, size = 24, withLabel = false }) => {
  return (
    <Stack
      minWidth={size}
      minHeight={size}
      direction={'row'}
      alignItems={'center'}
      spacing={1}
    >
      <Tooltip title={codeTypeToIcon[codeType]?.label} placement="top-start">
        <Image
          src={codeTypeToIcon[codeType]?.icon}
          alt={codeTypeToIcon[codeType]?.label}
          width={size}
          height={size}
        />
      </Tooltip>
      {withLabel && (
        <Typography variant={'caption'}>
          {codeTypeToIcon[codeType]?.label}
        </Typography>
      )}
    </Stack>
  )
}

export default CodeQuestionTypeIcon
