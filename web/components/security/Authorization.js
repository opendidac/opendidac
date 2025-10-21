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
import { signOut, useSession } from 'next-auth/react'
import { Role } from '@prisma/client'
import Unauthorized from './Unauthorized'
import { Button, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useGroup } from '../../context/GroupContext'
import UnauthorizedMissingGroups from './UnauthorizedMissingGroups'

const Authorization = ({ children, allowRoles = [] }) => {
  const { groups } = useGroup()
  const { data: session } = useSession()

  const [isAuthorized, setIsAuthorized] = useState(undefined)
  const [hasRequiredGroups, setHasRequiredGroups] = useState(true) // Default to true

  useEffect(() => {
    const userHasAllowedRole =
      session?.user &&
      session.user.roles.some((role) => allowRoles.includes(role))

    const isProfessor = session?.user.roles.includes(Role.PROFESSOR)
    const professorHasGroups = groups?.length > 0

    setIsAuthorized(userHasAllowedRole)
    setHasRequiredGroups(isProfessor ? professorHasGroups : true)
  }, [groups, session, allowRoles])

  if (isAuthorized === false) {
    return (
      <Unauthorized>
        <Typography variant="h6">
          You are not authorized to view this page.
        </Typography>
        <Button onClick={() => signOut()} variant="text" color="primary">
          Sign Out
        </Button>
      </Unauthorized>
    )
  }

  if (!hasRequiredGroups && groups !== undefined) {
    return <UnauthorizedMissingGroups />
  }

  return children
}

export default Authorization
