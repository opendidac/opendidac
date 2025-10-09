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
import MarkdownViewer from '@/components/input/markdown/MarkdownViewer'
import { useEffect, useState } from 'react'
import Loading from '@/components/feedback/Loading'
import { Card, CardContent } from '@mui/material'

const Terms = () => {
  const [terms, setTerms] = useState()
  useEffect(() => {
    if (!terms) {
      fetch('/api/terms')
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch terms of service')
          }
          return res.json()
        })
        .then((json) => setTerms(json.terms))
        .catch((err) => {
          console.error('Error fetching terms of service:', err)
          setTerms(
            '## Terms of service\n*No terms of service configured yet.*\n\nPlease contact the administrator.',
          )
        })
    }
  })
  return (
    <Loading loading={terms === undefined}>
      <Card
        variant={'elevation'}
        sx={{
          minWidth: 600,
          maxWidth: 800,
          margin: 'auto',
          marginBlock: 4,
          p: 3,
        }}
      >
        <CardContent>
          <MarkdownViewer content={terms} />
        </CardContent>
      </Card>
    </Loading>
  )
}

Terms.requireAuth = false

export default Terms
