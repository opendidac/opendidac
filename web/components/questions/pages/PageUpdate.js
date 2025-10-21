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

import { useRouter } from 'next/router'
import { Box } from '@mui/material'
import LayoutMain from '../../layout/LayoutMain'
import { Role } from '@prisma/client'
import Authorization from '../../security/Authorization'
import QuestionUpdate from '../../question/QuestionUpdate'
import BackButton from '../../layout/BackButton'

const PageUpdate = () => {
  const router = useRouter()
  const { groupScope, from } = router.query

  // Ensure a safe relative URL
  const backUrl =
    from && from.startsWith('/')
      ? decodeURIComponent(from)
      : `/${groupScope}/questions`

  return (
    <Authorization allowRoles={[Role.PROFESSOR]}>
      <LayoutMain hideLogo header={<BackButton backUrl={backUrl} />}>
        <Box width="100%" height="100%" pt={1}>
          <QuestionUpdate
            groupScope={groupScope}
            questionId={router.query.questionId}
          />
        </Box>
      </LayoutMain>
    </Authorization>
  )
}

export default PageUpdate
