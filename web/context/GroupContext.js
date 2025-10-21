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
import React, { createContext, useContext } from 'react'
import { fetcher } from '../code/utils'
import useSWR from 'swr'

const GroupContext = createContext()
export const useGroup = () => useContext(GroupContext)

export const GroupProvider = ({ children }) => {
  const { data: groups, mutate, error } = useSWR(`/api/users/groups`, fetcher)
  const switchGroup = async (scope) => {
    // Persist the selected group in the database
    return await fetch('/api/users/groups/select', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        groupScope: scope,
      }),
    }).finally(() => {
      mutate()
    })
  }

  return (
    <GroupContext.Provider
      value={{
        groups,
        switchGroup,
        mutate,
        error,
      }}
    >
      {children}
    </GroupContext.Provider>
  )
}
