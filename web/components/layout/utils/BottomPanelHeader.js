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
import { Box, Button, Stack } from '@mui/material'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { useBottomPanel } from '../../../context/BottomPanelContext'
import { useTheme } from '@emotion/react'

const BottomPanelHeader = ({ children, showOpenButton = false, maxHeight, ...props }) => {
  const theme = useTheme()
  const { isPanelOpen, toggleOpen } = useBottomPanel()

  return (
    <Stack
      onClick={toggleOpen}
      direction={'row'}
      spacing={1}
      alignItems={'center'}
      justifyContent={'space-between'}
      width={'100%'}
      pr={1}
      borderTop={`1px solid ${theme.palette.divider}`}
      maxHeight={maxHeight}
      {...props}
    >
      <Box onClick={(e) => e.stopPropagation()}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          p={1}
          pb={2}
          pt={2}
        >
          {children}
        </Stack>
      </Box>
      {(isPanelOpen || showOpenButton) && (
        <Button
          size={'small'}
          onClick={toggleOpen}
          endIcon={
            isPanelOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />
          }
        >
          {isPanelOpen ? 'Hide' : 'Open'}
        </Button>
      )}
    </Stack>
  )
}

export default BottomPanelHeader
