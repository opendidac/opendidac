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
import { Tab, Tabs, Typography } from '@mui/material'
import { useState } from 'react'
import TabPanel from '../../layout/utils/TabPanel'
import TabContent from '../../layout/utils/TabContent'
import Setup from './database/Setup'
import useSWR from 'swr'
import { fetcher } from '../../../code/utils'
import SolutionQueriesManager from './database/SolutionQueriesManager'
import Loading from '../../feedback/Loading'

const Database = ({ groupScope, questionId, onUpdate }) => {
  const { data: database, error } = useSWR(
    `/api/${groupScope}/questions/${questionId}/database`,
    groupScope && questionId ? fetcher : null,
    { revalidateOnFocus: false },
  )

  const [tab, setTab] = useState(1)

  return (
    <Loading loading={!database} errors={[error]}>
      <Tabs
        value={tab}
        onChange={(_, val) => setTab(val)}
        aria-label="database tabs"
      >
        <Tab
          label={<Typography variant="caption">Setup</Typography>}
          value={0}
        />
        <Tab
          label={<Typography variant="caption">Queries</Typography>}
          value={1}
        />
      </Tabs>
      <TabPanel id="setup" value={tab} index={0}>
        <TabContent padding={2} spacing={4}>
          <Setup
            groupScope={groupScope}
            questionId={questionId}
            database={database}
            onChange={(data) => {
              database.image = data.image
              onUpdate && onUpdate()
            }}
          />
        </TabContent>
      </TabPanel>
      <TabPanel id="queries" value={tab} index={1}>
        <TabContent>
          <SolutionQueriesManager
            groupScope={groupScope}
            questionId={questionId}
            onUpdate={onUpdate}
          />
        </TabContent>
      </TabPanel>
    </Loading>
  )
}

export default Database
