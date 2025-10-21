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
import { Button, Stack, Tooltip, Typography } from '@mui/material'
import Image from 'next/image'
import ClearIcon from '@mui/icons-material/Clear'

import UserAvatar from '@/components/layout/UserAvatar'

const GradingSigned = ({ signedBy, readOnly, onUnsign }) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ cursor: 'pointer', height: '100%', borderRadius: 1 }}
    >
      <UserAvatar user={signedBy} size={32} />
      <Stack alignItems="center">
        <Image
          src="/svg/grading/signed-off.svg"
          alt="Signed Off"
          width={32}
          height={32}
        />
      </Stack>
      {!readOnly && (
        <Tooltip title="CTRL+Enter">
          <Button
            size="small"
            id="grading-sign-off-remove"
            startIcon={
              <ClearIcon sx={{ color: 'error.main', width: 24, height: 24 }} />
            }
            onClick={onUnsign}
          >
            <Typography variant="body1">Unsign</Typography>
          </Button>
        </Tooltip>
      )}
    </Stack>
  )
}

export default GradingSigned
