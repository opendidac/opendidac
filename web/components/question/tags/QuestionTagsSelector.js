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
import { useTags } from '../../../context/TagContext'
import { useCallback } from 'react'
import useSWR from 'swr'
import TagsSelector from '../../input/TagsSelector'
import Loading from '../../feedback/Loading'
import { fetcher } from '../../../code/utils'

const QuestionTagsSelector = ({ groupScope, questionId, size, onChange }) => {
  const { tags: allTags, upsert } = useTags()

  const {
    data: tags,
    mutate,
    error,
  } = useSWR(
    `/api/${groupScope}/questions/${questionId}/tags`,
    questionId ? fetcher : null,
    {
      fallbackData: [],
    },
  )

  const onTagsChange = useCallback(
    async (newTags) => {
      await upsert(questionId, newTags)
      await mutate(newTags)
      onChange && onChange(newTags)
    },
    [questionId, mutate, upsert, onChange],
  )

  return (
    <Loading loading={!tags} errors={[error]}>
      <TagsSelector
        size={size}
        options={allTags.map((tag) => tag.label)}
        value={tags.map((tag) => tag.label)}
        onChange={onTagsChange}
      />
    </Loading>
  )
}

export default QuestionTagsSelector
