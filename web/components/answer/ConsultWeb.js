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

import WebEditor from '@/components/question/type_specific/web/WebEditor'
import PreviewPanel from '@/components/question/type_specific/web/PreviewPanel'
import ResizePanel from '@/components/layout/utils/ResizePanel'
import ScrollContainer from '@/components/layout/ScrollContainer'

const ConsultWeb = ({ answer }) => {
  return (
    <Stack mt={1} height={'100%'}>
      <ResizePanel
        leftPanel={
          <Stack spacing={0} pt={0} position={'relative'} height={'100%'}>
            <Stack p={1}>
              <Typography variant="body1">Your Answer</Typography>
            </Stack>
            <Stack flex={1}>
              <ScrollContainer>
                <WebEditor id={'consult-web'} readOnly web={answer} />
              </ScrollContainer>
            </Stack>
          </Stack>
        }
        rightPanel={<PreviewPanel id={`consult-preview`} web={answer} />}
      />
    </Stack>
  )
}

export default ConsultWeb
