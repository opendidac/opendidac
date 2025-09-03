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
import { Stack, Tooltip, Typography, Box } from '@mui/material'
import { getTextByType, getTooltipByType, getColorByType } from './types.js'

const QuestionTypeIcon = ({ type, size = 40, withLabel = false }) => {
  // Calculate SVG size proportionally (60% of container size)
  const svgSize = Math.round(size * 0.6)

  return (
    <Tooltip title={getTooltipByType(type)} placement="top-start">
      <Stack
        direction={'row'}
        spacing={1}
        alignItems={'center'}
      >
        <Stack
          bgcolor={getColorByType(type)}
          borderRadius={1}
          p={1}
          width={size}
          height={size}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Box
            component="img"
            src={`/svg/questions/${type}.svg`}
            alt="Question Type Icon"
            maxWidth={svgSize}
            maxHeight={svgSize}
            sx={{
              width: svgSize,
              height: svgSize,
              display: 'block',
            }}
          />
        </Stack>
        {withLabel && (
          <Typography variant="caption" sx={{ textAlign: 'center' }}>
            <b>{getTextByType(type)}</b>
          </Typography>
        )}
      </Stack>
    </Tooltip>
  )
}
export default QuestionTypeIcon
