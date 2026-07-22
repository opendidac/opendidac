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
import {
  MenuItem,
  Stack,
  Tab,
  Tabs,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Button,
} from '@mui/material'
import TabPanel from '../../../layout/utils/TabPanel'
import TabContent from '../../../layout/utils/TabContent'
import QueryOutput from './QueryOutput'
import { StudentPermission, DatabaseQueryOutputTest } from '@prisma/client'
import DropDown from '../../../input/DropDown'
import InlineMonacoEditor from '../../../input/InlineMonacoEditor'
import DialogFeedback from '../../../feedback/DialogFeedback'
import BottomPanelHeader from '../../../layout/utils/BottomPanelHeader'
import BottomPanelContent from '../../../layout/utils/BottomPanelContent'
import SeededTextField from '../../../input/SeededTextField'
import { useSeededState } from '@/hooks/useSeededState'

const QueryUpdatePanel = ({ query, output, onChange, onDelete }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [tab, setTab] = useState(0)

  useEffect(() => {
    setTab(0)
    setDeleteDialogOpen(false)
  }, [query?.id])

  return (
    query && (
      <>
        <BottomPanelHeader>
          <Typography variant="body1">{`Query #${query.order} - ${
            query.title || 'Untitled'
          }`}</Typography>
          {query.description && (
            <Typography variant="body2">{query.description}</Typography>
          )}
        </BottomPanelHeader>
        <BottomPanelContent>
          <Stack bgcolor={'white'} spacing={2}>
            <Stack
              direction={'row'}
              spacing={1}
              alignItems={'center'}
              justifyContent={'space-between'}
              p={1}
            >
              <Stack flex={1}>
                <Tabs
                  value={tab}
                  onChange={(ev, val) => setTab(val)}
                  aria-label="query panel tabs"
                >
                  <Tab
                    label={<Typography variant="caption">Output</Typography>}
                    value={0}
                  />
                  <Tab
                    label={<Typography variant="caption">Settings</Typography>}
                    value={1}
                  />
                  <Tab
                    label={<Typography variant="caption">Template</Typography>}
                    value={2}
                  />
                </Tabs>
              </Stack>
              <Button
                variant={'outlined'}
                color={'primary'}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete query #{query.order}
              </Button>
            </Stack>
            <TabPanel id="output" value={tab} index={0}>
              <TabContent padding={2} spacing={4}>
                <QueryOutputTab
                  query={query}
                  queryOutput={output}
                  onChange={(q) => onChange(q)}
                />
              </TabContent>
            </TabPanel>
            <TabPanel id="settings" value={tab} index={1}>
              <TabContent padding={2} spacing={4}>
                <QuerySettingsTab query={query} onChange={(q) => onChange(q)} />
              </TabContent>
            </TabPanel>
            <TabPanel id="template" value={tab} index={2}>
              <TabContent padding={2} spacing={4}>
                <QueryTemplateTab query={query} onChange={(q) => onChange(q)} />
              </TabContent>
            </TabPanel>
          </Stack>
        </BottomPanelContent>
        <DialogFeedback
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          title={`Delete query #${query.order}`}
          content={`Are you sure you want to delete query #${query.order}?`}
          onConfirm={() => {
            setDeleteDialogOpen(false)
            onDelete && onDelete(query)
          }}
        />
      </>
    )
  )
}

/*

enum DatabaseQueryOutputTest {
  IGNORE_COLUMN_ORDER
  IGNORE_ROW_ORDER
  IGNORE_EXTRA_COLUMNS
  INGORE_COLUMN_TYPES
}
* */

const InputDatabaseQueryOutputTest = {
  [DatabaseQueryOutputTest.IGNORE_COLUMN_ORDER]: {
    label: 'Column order',
  },
  [DatabaseQueryOutputTest.IGNORE_ROW_ORDER]: {
    label: 'Row order',
  },
  [DatabaseQueryOutputTest.IGNORE_EXTRA_COLUMNS]: {
    label: 'Extra columns',
  },
  [DatabaseQueryOutputTest.INGORE_COLUMN_TYPES]: {
    label: 'Column types',
  },
}

const QueryOutputTab = ({ query, queryOutput, onChange }) => {
  const [enableOutputTest, setEnableOutputTest] = useSeededState(
    query.testQuery,
    query.id,
  )
  const [activeTests, setActiveTests] = useSeededState(
    query.queryOutputTests,
    query.id,
  )

  return (
    <Stack spacing={3} width={'100%'} pb={1}>
      <QueryOutput queryOutput={queryOutput} />
      <FormGroup>
        <Stack direction={'row'} spacing={1}>
          <FormControlLabel
            label="Output test"
            control={
              <Switch
                checked={enableOutputTest}
                onChange={(ev) => {
                  setEnableOutputTest(ev.target.checked)
                  onChange({
                    ...query,
                    testQuery: ev.target.checked,
                  })
                }}
              />
            }
          />
          {enableOutputTest && (
            <Stack spacing={1} direction={'row'} alignItems={'center'}>
              <Typography variant={'h6'}>Ignore : </Typography>
              {Object.keys(InputDatabaseQueryOutputTest).map((key) => {
                const { label } = InputDatabaseQueryOutputTest[key]
                return (
                  <OutputTestToggle
                    key={key}
                    toggled={activeTests.some((test) => test.test === key)}
                    label={label}
                    testKey={key}
                    onToggle={(isChecked, testKey) => {
                      const newTests = isChecked
                        ? [...activeTests, { test: testKey }]
                        : activeTests.filter((test) => test.test !== testKey)
                      setActiveTests(newTests)
                      onChange({
                        ...query,
                        queryOutputTests: newTests,
                      })
                    }}
                  />
                )
              })}
            </Stack>
          )}
        </Stack>
      </FormGroup>
    </Stack>
  )
}

const OutputTestToggle = ({ toggled, label, testKey, onToggle }) => {
  const [enabled, setEnabled] = useState(toggled)

  useEffect(() => {
    setEnabled(toggled)
  }, [toggled])

  const handleToggle = (ev) => {
    const isChecked = ev.target.checked
    setEnabled(isChecked)
    onToggle(isChecked, testKey)
  }

  return (
    <FormControlLabel
      label={label}
      control={
        <Switch color="info" checked={enabled} onChange={handleToggle} />
      }
    />
  )
}

const QuerySettingsTab = ({ query, onChange }) => {
  const [studentPermission, setStudentPermission] = useSeededState(
    query.studentPermission,
    query.id,
  )
  const [lintActive, setLintActive] = useSeededState(query.lintActive, query.id)

  return (
    <Stack spacing={3} width={'100%'}>
      <Stack direction={'row'} spacing={2}>
        <DropDown
          id={`${query.id}-student-permission`}
          name="Student Permission"
          defaultValue={studentPermission}
          minWidth="200px"
          maxWidth="200px"
          onChange={async (permission) => {
            setStudentPermission(permission)
            onChange({
              ...query,
              studentPermission: permission,
            })
          }}
        >
          <MenuItem value={StudentPermission.UPDATE}>Update</MenuItem>
          <MenuItem value={StudentPermission.VIEW}>View</MenuItem>
          <MenuItem value={StudentPermission.HIDDEN}>Hidden</MenuItem>
        </DropDown>
        <SeededTextField
          label={'Title'}
          contentKey={`query-settings-title:${query.id}`}
          defaultValue={query.title || ''}
          fullWidth
          onChange={(value) => {
            onChange({
              ...query,
              title: value,
            })
          }}
        />
      </Stack>
      <SeededTextField
        label={'Description'}
        contentKey={`query-settings-description:${query.id}`}
        defaultValue={query.description || ''}
        onChange={(value) => {
          onChange({
            ...query,
            description: value,
          })
        }}
      />
      {query.studentPermission === StudentPermission.UPDATE && (
        <>
          <FormControlLabel
            control={
              <Switch
                checked={lintActive}
                onChange={(ev) => {
                  setLintActive(ev.target.checked)
                  onChange({
                    ...query,
                    lintActive: ev.target.checked,
                  })
                }}
                name="lintActiveSwitch"
              />
            }
            label="Linter active"
          />
          <SeededTextField
            label={'Custom Lint Rules'}
            contentKey={`query-settings-lint-rules:${query.id}`}
            defaultValue={query.lintRules || ''}
            multiline
            fullWidth
            minRows={3}
            maxRows={10}
            disabled={!lintActive}
            onChange={(value) => {
              onChange({
                ...query,
                lintRules: value,
              })
            }}
          />
        </>
      )}
    </Stack>
  )
}

const QueryTemplateTab = ({ query, onChange }) => {
  return (
    <InlineMonacoEditor
      contentKey={`sql-template:${query.id}`}
      defaultValue={query.template}
      language={'sql'}
      readOnly={false}
      onChange={(sql) => {
        onChange({
          ...query,
          template: sql,
        })
      }}
    />
  )
}

export default QueryUpdatePanel
