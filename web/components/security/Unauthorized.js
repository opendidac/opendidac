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
import { Box, Stack } from '@mui/material'
import Image from 'next/image'
const Unauthorized = ({ children }) => {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      height={'100vh'}
      width={'100vw'}
    >
      <Box sx={{ width: '20%', height: '20%', position: 'relative' }}>
        <Image src="/svg/401.svg" alt="Unauthorized" fill priority="1" />
      </Box>
      <Stack spacing={1} padding={2} alignItems="center">
        {children}
      </Stack>
    </Stack>
  )
}
export default Unauthorized
