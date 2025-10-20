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

import TagsSelector from '@/components/input/TagsSelector'
import {
  Alert,
  AlertTitle,
  FormControlLabel,
  FormGroup,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { UserOnEvaluationAccessMode } from '@prisma/client'
import { useEffect, useState } from 'react'

const SettingsAccessMode = ({
  accessMode: initialMode,
  accessList: initialList,
  onChange,
}) => {
  const [accessMode, setAccessMode] = useState(
    UserOnEvaluationAccessMode.LINK_ONLY,
  )
  const [accessList, setAccessList] = useState([])

  useEffect(() => {
    if (initialMode) {
      setAccessMode(initialMode)
    }
    if (initialList) {
      setAccessList(initialList)
    }
  }, [initialMode, initialList])

  return (
    <>
      <Typography variant="h6">Access mode</Typography>
      <Alert severity="info">
        <Typography variant="body2">
          With the restricted access enabled, students with an email address in
          the list will be granted instant access to the evaluation.
        </Typography>
        <Typography variant="body2">
          Students not part of the list will go through a verification process.
          You will see them appear in the denied list where you can grant them
          access. This feature gives you the freedom to review and grant access
          permissions on the go.
        </Typography>
      </Alert>
      <Stack spacing={2}>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={
                  accessMode === UserOnEvaluationAccessMode.LINK_AND_ACCESS_LIST
                }
                onChange={(e) => {
                  const newAccessMode = e.target.checked
                    ? UserOnEvaluationAccessMode.LINK_AND_ACCESS_LIST
                    : UserOnEvaluationAccessMode.LINK_ONLY
                  setAccessMode(newAccessMode)
                  onChange(newAccessMode, accessList)
                }}
              />
            }
            label="Restricted to access list"
          />
        </FormGroup>
        {accessMode === UserOnEvaluationAccessMode.LINK_AND_ACCESS_LIST && (
          <>
            <Typography variant="body1">
              Provide your access list by pasting it directly from your email
              client.
            </Typography>
            <Typography variant="body2">
              Supported separators are: comma, semicolon, newline.{' '}
            </Typography>
            <TagsSelector
              label="Access list"
              placeholder="email1@heig-vd.ch, email2@heig-vd.ch..."
              value={accessList}
              options={[]}
              validateTag={(tag) => {
                return tag.match(
                  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                )
              }}
              formatTag={(tag) => {
                // Try to find an email address anywhere within the string
                const match = tag.match(
                  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
                )
                if (match && match[0]) {
                  // If an email address is found, return it in lowercase
                  const email = match[0].toLowerCase()
                  return email
                }
                // If no email address is found, return the tag as is, it will be invalid anyway
                return tag
              }}
              onChange={(emails) => {
                setAccessList(emails)
                onChange(accessMode, emails)
              }}
            />
            {accessList?.length > 0 && (
              <Alert severity="info">
                <AlertTitle>Access list</AlertTitle>
                <Typography variant="body1" component={'span'}>
                  Access list contains {accessList.length} email addresses.
                </Typography>
              </Alert>
            )}
          </>
        )}
      </Stack>
    </>
  )
}

export default SettingsAccessMode
