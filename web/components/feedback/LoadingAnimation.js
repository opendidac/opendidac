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
import { Stack } from '@mui/material'
import Image from 'next/image'

const LoadingStatus = {
  LOADING: 'loading',
  ERROR: 'error',
  INFO: 'info',
}

const statusToIcon = {
  [LoadingStatus.LOADING]: '/svg/loading.svg',
  [LoadingStatus.ERROR]: '/svg/exclamation-mark.svg',
  [LoadingStatus.INFO]: '/svg/info.svg',
}

const LoadingAnimation = ({ content, status = LoadingStatus.LOADING }) => (
  <Stack
    alignItems="stretch"
    justifyContent="center"
    spacing={2}
    flex={1}
    p={2}
  >
    <Stack alignItems="center" justifyContent="center" spacing={2}>
      <Image
        alt="Loading..."
        src={statusToIcon[status]}
        width={80}
        height={80}
        priority="1"
      />
      <Stack alignItems="center">{content}</Stack>
    </Stack>
  </Stack>
)
export default LoadingAnimation
