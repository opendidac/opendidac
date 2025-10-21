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
import { Stack, Tooltip } from '@mui/material'
import Image from 'next/image'
import { StudentPermission } from '@prisma/client'

const permissionToIcon = {
  [StudentPermission.VIEW]: {
    src: '/svg/icons/viewable.svg',
    tooltip: 'You have view permission',
    text: 'view',
  },
  [StudentPermission.UPDATE]: {
    src: '/svg/icons/editable.svg',
    tooltip: 'You have edit permission',
    text: 'edit',
  },
  [StudentPermission.HIDDEN]: {
    src: '/svg/icons/hidden.svg',
    tooltip: 'You have no permission',
    text: 'hidden',
  },
}

const StudentPermissionIcon = ({ permission, size = 16 }) => {
  return (
    <Tooltip title={permissionToIcon[permission].tooltip} placement="bottom">
      <Stack>
        <Image
          alt={'permission'}
          src={permissionToIcon[permission].src}
          width={size}
          height={size}
        />
      </Stack>
    </Tooltip>
  )
}

export default StudentPermissionIcon
