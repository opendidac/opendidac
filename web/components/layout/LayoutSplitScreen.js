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
import { Paper, Stack } from '@mui/material'
import ResizePanel from './utils/ResizePanel'
import ScrollContainer from './ScrollContainer'

const LayoutSplitScreen = ({
  subheader,
  leftPanel,
  rightPanel,
  footer,
  rightWidth = 60,
  height = '100%',
  useScrollContainer = true,
}) => {
  return (
    <Stack height={height} maxHeight={height} minHeight={height}>
      {subheader && subheader}
      <Stack flex={1} alignItems="center" maxHeight="100%">
        <ResizePanel
          rightWidth={rightWidth}
          leftPanel={<ScrollContainer>{leftPanel}</ScrollContainer>}
          rightPanel={
            <Paper
              square
              elevation={0}
              sx={{ height: '100%', overflow: 'hidden' }}
            >
              {useScrollContainer ? (
                <ScrollContainer spacing={0} padding={0}>
                  {rightPanel}
                </ScrollContainer>
              ) : (
                rightPanel
              )}
            </Paper>
          }
        />
      </Stack>
      {footer && footer}
    </Stack>
  )
}

export default LayoutSplitScreen
