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
import React, { useState } from 'react'
import { Chip, Stack, Typography } from '@mui/material'

const QuestionTagsViewer = ({
  tags = [],
  size = 'medium',
  collapseAfter = Infinity,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)

  const displayedTags = isHovered ? tags : tags.slice(0, collapseAfter)

  return (
    <Stack
      direction={'row'}
      rowGap={1}
      flexWrap="wrap"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {displayedTags.map((tag, index) => (
        <Chip
          size={size}
          key={tag.label}
          color={'info'}
          variant="filled"
          label={<Typography variant={'caption'}>{tag.label}</Typography>}
          sx={{ mr: 1 }}
        />
      ))}
      {!isHovered && tags.length > collapseAfter && (
        <Chip
          size={size}
          key="more"
          variant="outlined"
          label={
            <Typography variant={'caption'}>{`+${
              tags.length - collapseAfter
            }`}</Typography>
          }
          sx={{ mr: 1 }}
        />
      )}
    </Stack>
  )
}

export default QuestionTagsViewer
