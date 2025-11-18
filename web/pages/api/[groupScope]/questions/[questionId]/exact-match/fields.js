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

import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import { withQuestionUpdate } from '@/middleware/withUpdate'
import { Role } from '@prisma/client'

const put = async (ctx) => {
  const { req, res, prisma } = ctx
  const { questionId } = req.query
  const { field } = req.body

  const exactMatch = await prisma.exactMatch.findUnique({
    where: { questionId: questionId },
    include: {
      fields: true,
    },
  })

  if (!exactMatch.fields.some((f) => f.id === field.id)) {
    res.status(404).json({ message: 'Field not found' })
    return
  }

  let updatedField = await prisma.exactMatchField.update({
    where: { id: field.id },
    data: {
      statement: field.statement,
      matchRegex: field.matchRegex,
    },
  })

  res.status(200).json(updatedField)
}

const post = async (ctx) => {
  const { req, res, prisma } = ctx
  const { questionId } = req.query
  const { field } = req.body

  const countFields = await prisma.exactMatchField.count({
    where: { exactMatch: { questionId: questionId } },
  })

  const newField = await prisma.exactMatchField.create({
    data: {
      statement: field.statement,
      matchRegex: field.matchRegex,
      order: countFields, // Ensure the new field is added at the end
      exactMatch: { connect: { questionId: questionId } },
    },
  })

  res.status(200).json(newField)
}

const del = async (ctx) => {
  const { req, res, prisma } = ctx
  const { questionId } = req.query
  const { fieldId } = req.body

  // check if field belongs to the question
  const exactMatch = await prisma.exactMatch.findUnique({
    where: { questionId: questionId },
    include: {
      fields: true,
    },
  })

  if (!exactMatch.fields.some((f) => f.id === fieldId)) {
    res.status(404).json({ message: 'Field not found' })
    return
  }

  if (exactMatch.fields.length <= 1) {
    res.status(400).json({ message: 'Cannot delete the last field' })
    return
  }

  await prisma.exactMatchField.delete({
    where: { id: fieldId },
  })

  // reorder fields after deletion
  const remainingFields = await prisma.exactMatchField.findMany({
    where: { exactMatch: { questionId: questionId } },
    orderBy: { order: 'asc' },
  })

  await prisma.$transaction(async (transaction) => {
    await Promise.all(
      remainingFields.map((field, index) =>
        transaction.exactMatchField.update({
          where: { id: field.id },
          data: { order: index },
        }),
      ),
    )
  })

  res.status(200).json({ message: 'Field deleted successfully' })
}

const get = async (ctx) => {
  const { req, res, prisma } = ctx
  const { questionId } = req.query

  const exactMatch = await prisma.exactMatch.findUnique({
    where: { questionId: questionId },
    include: {
      fields: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!exactMatch) {
    res.status(404).json({ message: 'Question not found' })
    return
  }

  res.status(200).json(exactMatch.fields)
}

export default withApiContext({
  GET: withGroupScope(withAuthorization(get, { roles: [Role.PROFESSOR] })),
  PUT: withGroupScope(
    withAuthorization(withQuestionUpdate(put), {
      roles: [Role.PROFESSOR],
    }),
  ),
  POST: withGroupScope(
    withAuthorization(withQuestionUpdate(post), {
      roles: [Role.PROFESSOR],
    }),
  ),
  DELETE: withGroupScope(
    withAuthorization(withQuestionUpdate(del), {
      roles: [Role.PROFESSOR],
    }),
  ),
})
