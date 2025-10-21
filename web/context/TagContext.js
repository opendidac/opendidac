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
import useSWR from 'swr'
import { Role } from '@prisma/client'
import { useSession } from 'next-auth/react'
import { fetcher } from '../code/utils'
import { useRouter } from 'next/router'

const TagsContext = createContext()
export const useTags = () => useContext(TagsContext)

const isProfessor = (user) => user?.roles?.includes(Role.PROFESSOR) || false

export const TagsProvider = ({ children }) => {
  const router = useRouter()

  const { groupScope } = router.query

  const { data: session } = useSession()

  const {
    data: tags,
    mutate,
    error,
  } = useSWR(
    `/api/${groupScope}/questions/tags`,
    groupScope && isProfessor(session.user) ? fetcher : null,
    { fallbackData: [] },
  )

  useEffect(() => {
    if (session) {
      ;(async () => {
        await mutate()
      })()
    }
  }, [session, mutate])

  const upsert = useCallback(
    async (questionId, tags) => {
      return await fetch(`/api/${groupScope}/questions/${questionId}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          tags,
        }),
      })
        .then((res) => res.json())
        .then(async (updated) => {
          await mutate(updated)
        })
    },
    [groupScope, mutate],
  )

  if (error) return children // they wont have access to tags

  return (
    <TagsContext.Provider
      value={{
        tags: tags || [],
        upsert,
      }}
    >
      {children}
    </TagsContext.Provider>
  )
}
