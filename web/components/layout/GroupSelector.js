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

import DropDown from '../input/DropDown'
import GroupIcon from '@mui/icons-material/Group'
import { MenuItem } from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import Loading from '../feedback/Loading'
import { useGroup } from '../../context/GroupContext'

const GroupSelector = () => {
  const { push, asPath, query } = useRouter()

  const { groupScope } = query

  const { groups, switchGroup, error: errorGroups } = useGroup()

  const findGroupBy = useCallback(
    (what, value) =>
      groups?.map((uOg) => uOg.group).find((group) => group[what] === value) ||
      undefined,
    [groups],
  )

  const switchGroupLink = (group) => {
    // replaces the root part of the path by the new group scope
    const replaced = asPath.replace(/\/[^\/]*\//, `/${group.scope}/`)
    // If nothing was replaced (e.g., we are at '/'), navigate to questions
    if (replaced === asPath) {
      return `/${group.scope}/questions`
    }
    return replaced
  }

  const handleGroupClick = async (group) => {
    await push(switchGroupLink(group)).finally(() => {
      switchGroup(group.scope)
    })
  }

  const [selected, setSelected] = useState(undefined)

  useEffect(() => {
    if (groups && groups.length > 0) {
      const found = groupScope ? findGroupBy('scope', groupScope) : undefined
      const group = found || groups[0].group
      setSelected(group)
    }
  }, [groupScope, groups, findGroupBy])

  return (
    <Loading loading={!groups} error={errorGroups}>
      {groups?.length > 0 && selected && (
        <DropDown
          name="group"
          defaultValue={selected.label}
          minWidth={'100px'}
          icon={<GroupIcon />}
          variant={'filled'}
        >
          {groups.map(({ group }) => (
            <MenuItem
              key={group.id}
              value={group.label}
              onClick={() => handleGroupClick(group)}
            >
              {group.label}
            </MenuItem>
          ))}
        </DropDown>
      )}
    </Loading>
  )
}

export default GroupSelector
