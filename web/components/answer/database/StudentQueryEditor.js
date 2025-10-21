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
import React, { useEffect, useState } from 'react'
import { StudentPermission } from '@prisma/client'
import { Stack } from '@mui/material'

import QueryEditor from '@/components/question/type_specific/database/QueryEditor'
import StudentPermissionIcon from '@/components/feedback/StudentPermissionIcon'

const StudentQueryEditor = ({ query: initial, onChange }) => {
  const [query, setQuery] = useState(initial)

  useEffect(() => setQuery(initial), [initial, initial.id])

  return (
    <Stack>
      <QueryEditor
        order={query.order}
        key={query.id}
        headerLeft={
          <StudentPermissionIcon
            permission={query.studentPermission}
            size={16}
          />
        }
        readOnly={query.studentPermission !== StudentPermission.UPDATE}
        hidden={query.studentPermission === StudentPermission.HIDDEN}
        query={query}
        onChange={(q) => {
          setQuery(q)
          onChange && onChange(q)
        }}
      />
    </Stack>
  )
}

export default StudentQueryEditor
