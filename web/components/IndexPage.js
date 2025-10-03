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
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Loading from '@/components/feedback/Loading'
import { useGroup } from '@/context/GroupContext'
import { Role } from '@prisma/client'

/*
 * This page is used to redirect the users to the correct scope based on their role
 * */
const IndexPage = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { groups, switchGroup } = useGroup()

  useEffect(() => {
    if (!session?.user?.roles) return

    const userRoles = session.user.roles
    const isSuperAdmin = userRoles.includes(Role.SUPER_ADMIN)
    const isArchivistOnly = userRoles.includes(Role.ARCHIVIST) && !isSuperAdmin
    const isProfessor = userRoles.includes(Role.PROFESSOR)

    // Handle ARCHIVIST users - redirect to archiving
    if (isArchivistOnly) {
      router.push('/admin/archiving')
      return
    }

    // Handle PROFESSOR users - redirect to group scope (existing logic)
    if (isProfessor) {
      const selectedGroup = session?.user?.selected_group
      const availableScopes = groups?.map((g) => g.group.scope) || []

      // If user has groups but the selected group is missing or invalid,
      // present a group selector instead of redirecting
      let groupToSwitch = null
      if (groups && groups.length > 0) {
        if (selectedGroup && availableScopes.includes(selectedGroup)) {
          groupToSwitch = selectedGroup
        } else {
          const firstGroup = availableScopes[0]
          groupToSwitch = firstGroup
        }
        ;(async () => {
          await switchGroup(groupToSwitch)
          await router.push(`/${groupToSwitch}/questions`)
        })()
        return
      }

      // No groups at all: send to groups page to create one
      if (groups && groups.length === 0) {
        router.push('/groups')
        return
      }
    }

    // Handle SUPER_ADMIN users - redirect to admin
    if (!isProfessor && isSuperAdmin) {
      router.push('/admin')
      return
    }
  }, [switchGroup, groups, session, router])

  return <Loading />
}

export default IndexPage
