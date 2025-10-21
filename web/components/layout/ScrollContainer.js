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
import { Stack } from '@mui/material'

import { forwardRef } from 'react'

/*
Fill the parent container with a scrollable container.
Use absolute positioning to get the children out of the flow of the parent container,
insuring the children do not affect the size of the parent container.

The parent container must have a height and width set.
*/

const ScrollContainer = forwardRef(
  ({ children, dashed = false, ...props }, ref) => {
    return (
      <Stack
        ref={ref}
        position={'relative'}
        flex={1}
        overflow={'hidden'}
        height={'100%'}
        width={'100%'}
        border={dashed ? '1px dashed red' : 0}
      >
        <Stack
          position={'absolute'}
          top={0}
          left={0}
          bottom={0}
          right={0}
          overflow={'auto'}
          {...props}
        >
          {children}
        </Stack>
      </Stack>
    )
  },
)

ScrollContainer.displayName = 'ScrollContainer'
export default ScrollContainer
