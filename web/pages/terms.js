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

const Terms = () => {
  const [terms, setTerms] = useState()
  useEffect(() => {
    if (!terms) {
      fetch("/api/terms")
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch terms of service')
          }
          return res.json()
        })
        .then((json) => setTerms(json.terms))
        .catch((err) => {
          console.error('Error fetching terms of service:', err)
          setTerms('## Terms of service\n*No terms of service configured yet.*\n\nPlease contact the administrator.')
        })
    }
  })
  return (
    <MarkdownViewer content={terms} />
  )
}

Terms.requireAuth = false

export default Terms
