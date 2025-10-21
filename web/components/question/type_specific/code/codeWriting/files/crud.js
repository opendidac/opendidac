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
export const update = (nature, groupScope, questionId, codeToFile) =>
  fetch(
    `/api/${groupScope}/questions/${questionId}/code/code-writing/files/${nature}/${codeToFile.file.id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(codeToFile),
    },
  ).then((data) => data.json())

export const create = (nature, groupScope, questionId, codeToFile) =>
  fetch(
    `/api/${groupScope}/questions/${questionId}/code/code-writing/files/${nature}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(codeToFile),
    },
  ).then((data) => data.json())

export const del = (nature, groupScope, questionId, codeToFile) =>
  fetch(
    `/api/${groupScope}/questions/${questionId}/code/code-writing/files/${nature}/${codeToFile.file.id}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  ).then((data) => data.json())

export const pull = (groupScope, questionId) =>
  fetch(
    `/api/${groupScope}/questions/${questionId}/code/code-writing/files/solution/pull`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  ).then((data) => data.json())
