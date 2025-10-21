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
import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import MagicResizeHandle from './MagicResizeHandle'
import { Box, Stack } from '@mui/material'

const ResizePanel = ({
  leftPanel,
  rightPanel,
  rightWidth = 50,
  height = '100%',
  hideHandle = false,
}) => {
  return useMemo(
    () => (
      <Stack
        direction={'row'}
        sx={{ height: height, width: '100%' }}
        data-testid="resize-panel"
      >
        <Box height={'100%'} minWidth={0} flex={1} overflow={'hidden'}>
          {leftPanel}
        </Box>
        <MagicResizeHandle hideHandle={hideHandle} width={rightWidth} />
        <Box height={'100%'} minWidth={0} overflow={'hidden'}>
          {rightPanel}
        </Box>
      </Stack>
    ),
    [leftPanel, rightPanel, height, rightWidth, hideHandle],
  )
}

ResizePanel.propTypes = {
  leftPanel: PropTypes.element.isRequired,
  rightPanel: PropTypes.element.isRequired,
  rightWidth: PropTypes.number,
}

export default ResizePanel
