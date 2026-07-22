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

import React, { createContext, useContext, useCallback, useEffect } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { Role } from '@prisma/client'
import { useSession } from 'next-auth/react'
import { fetcher } from '../core/utils'
import { useRouter } from 'next/router'

const TagsContext = createContext({
  tags: [],
  upsert: async () => {},
  refresh: async () => {},
})
export const useTags = () => useContext(TagsContext)

const isProfessor = (user) => user?.roles?.includes(Role.PROFESSOR) || false

export const TagsProvider = ({ children }) => {
  const router = useRouter()

  const { groupScope } = router.query

  const { data: session } = useSession()

  const { mutate: globalMutate } = useSWRConfig()

  const {
    data: tags,
    mutate,
    error,
  } = useSWR(
    `/api/${groupScope}/questions/tags`,
    groupScope && session?.user && isProfessor(session.user) ? fetcher : null,
    { fallbackData: [] },
  )

  useEffect(() => {
    if (session) {
      ;(async () => {
        await mutate()
      })()
    }
  }, [session, mutate])

  // Revalidate every tag-related key: the group tag list (this context)
  // and all filter-side TagsSelector keys (same path with query params).
  // Use after any operation that may create or delete tags server-side
  // (tag edits, question imports, ...).
  const refresh = useCallback(async () => {
    await globalMutate(
      (key) =>
        typeof key === 'string' &&
        key.startsWith(`/api/${groupScope}/questions/tags`),
    )
  }, [groupScope, globalMutate])

  const upsert = useCallback(
    async (questionId, tags) => {
      await fetch(`/api/${groupScope}/questions/${questionId}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          tags,
        }),
      })
      // Never write the PUT response into the cache - it is a raw Prisma
      // transaction result, not a tag list.
      await refresh()
    },
    [groupScope, refresh],
  )

  return (
    <TagsContext.Provider
      value={{
        tags: tags || [],
        upsert,
        refresh,
      }}
    >
      {children}
    </TagsContext.Provider>
  )
}
