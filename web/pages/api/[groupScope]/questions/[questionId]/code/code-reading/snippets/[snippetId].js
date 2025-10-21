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
import { Role } from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'
import { withQuestionUpdate } from '@/middleware/withUpdate'

const put = async (req, res, prisma) => {
  // update a code snippet

  const { questionId, snippetId } = req.query
  const { snippet, output } = req.body

  // First, validate the questionId by checking if it's associated with the snippetId
  const existingSnippet = await prisma.codeReadingSnippet.findUnique({
    where: {
      id: snippetId,
    },
    include: {
      codeReading: true,
    },
  })

  // If the snippet doesn't exist or the questionId does not match, return an error
  if (
    !existingSnippet ||
    existingSnippet.codeReading.questionId !== questionId
  ) {
    return res.status(404).json({ message: 'Invalid questionId or snippetId' })
  }

  // If validation passes, proceed with the update
  const codeReadingSnippet = await prisma.codeReadingSnippet.update({
    where: {
      id: snippetId,
    },
    data: {
      snippet: snippet,
      output: output,
    },
  })

  res.status(200).json(codeReadingSnippet)
}

const del = async (req, res, prisma) => {
  // delete a code snippet

  const { questionId, snippetId } = req.query

  // First, validate the questionId by checking if it's associated with the snippetId
  const existingSnippet = await prisma.codeReadingSnippet.findUnique({
    where: {
      id: snippetId,
    },
    include: {
      codeReading: true,
    },
  })

  // If the snippet doesn't exist or the questionId does not match, return an error
  if (
    !existingSnippet ||
    existingSnippet.codeReading.questionId !== questionId
  ) {
    return res.status(404).json({ message: 'Invalid questionId or snippetId' })
  }

  // If validation passes, proceed with the deletion
  await prisma.codeReadingSnippet.delete({
    where: {
      id: snippetId,
    },
  })

  res.status(200).json({ message: 'Deleted' })
}

export default withGroupScope(
  withMethodHandler({
    PUT: withAuthorization(withQuestionUpdate(withPrisma(put)), [
      Role.PROFESSOR,
    ]),
    DELETE: withAuthorization(withQuestionUpdate(withPrisma(del)), [
      Role.PROFESSOR,
    ]),
  }),
)
