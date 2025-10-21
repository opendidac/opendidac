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
import { Tabs, Tab, Tooltip, Typography } from '@mui/material'
import { tabsClasses } from '@mui/material/Tabs'
import FilledBullet from '../../feedback/FilledBullet'

const Paging = ({ items, active, link }) => {
  const router = useRouter()

  const index_of = items.map(({ id }) => id).indexOf(active?.id || 0)

  return (
    <Tabs
      value={index_of === -1 ? false : index_of}
      variant="scrollable"
      scrollButtons
      sx={{
        [`& .${tabsClasses.scrollButtons}`]: {
          '&.Mui-disabled': { opacity: 0.3 },
        },
      }}
      onChange={(e, index) => router.push(link(items[index].id, index))}
    >
      {items.map((item, index) => (
        <Tooltip
          key={item.id}
          title={
            item.tooltip && (
              <Typography variant="caption">{item.tooltip}</Typography>
            )
          }
          placement="bottom"
        >
          <Tab
            label={item.label}
            iconPosition="start"
            sx={{ minHeight: '50px', minWidth: 0, mb: 1, mt: 1 }}
            value={index}
            icon={
              (item.icon && item.icon) ||
              (item.fillable && (
                <FilledBullet
                  index={index}
                  color={item.color}
                  state={item.state}
                />
              ))
            }
          />
        </Tooltip>
      ))}
    </Tabs>
  )
}

export default Paging
