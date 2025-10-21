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

const get = async (req, res, prisma) => {
  // get the solution queries for a database question

  const { questionId } = req.query

  const queries = await prisma.databaseToSolutionQuery.findMany({
    where: {
      questionId: questionId,
    },
    include: {
      query: {
        include: {
          queryOutputTests: true,
        },
      },
      output: true,
    },
    orderBy: [
      {
        query: {
          order: 'asc',
        },
      },
    ],
  })

  if (!queries) res.status(404).json({ message: 'Not found' })

  res.status(200).json(queries)
}

const post = async (req, res, prisma) => {
  // create a new empty solution query for a database question
  const { questionId } = req.query

  // determine the order of the new query
  const queries = await prisma.databaseToSolutionQuery.findMany({
    where: {
      questionId: questionId,
    },
  })

  const order = queries.length + 1
  let newQuery

  await prisma.$transaction(async (prisma) => {
    newQuery = await prisma.databaseQuery.create({
      data: {
        order: order,
        database: {
          connect: {
            questionId: questionId,
          },
        },
      },
    })

    // connect the new solution query to the question
    await prisma.databaseToSolutionQuery.create({
      data: {
        questionId: questionId,
        queryId: newQuery.id,
      },
    })
  })

  res.status(200).json(newQuery)
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    POST: withAuthorization(withQuestionUpdate(withPrisma(post)), [
      Role.PROFESSOR,
    ]),
  }),
)
