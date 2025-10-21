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
import { runSandbox } from '@/sandbox/runSandboxTC'
import {
  withAuthorization,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

/*
 endpoint to run the sandbox for a question with solution or template files recovered from the database
 used to run the sandbox for professor files, also use by pull solution output
 */
const post = async (req, res, prisma) => {
  const { questionId, nature } = req.query

  if (!['solution', 'template'].includes(nature)) {
    res.status(400).json({ message: 'Invalid nature' })
    return
  }

  const attribute = `${nature}Files`

  const code = await prisma.code.findUnique({
    where: {
      questionId: questionId,
    },
    include: {
      sandbox: true,
      codeWriting: {
        select: {
          testCases: {
            orderBy: {
              index: 'asc',
            },
          },
          [attribute]: {
            include: {
              file: true,
            },
          },
        },
      },
    },
  })

  if (!code || !code.codeWriting[attribute]) {
    res.status(404).json({ message: 'Code not found' })
    return
  }

  const image = code.sandbox.image
  const beforeAll = code.sandbox.beforeAll
  const files = code.codeWriting[attribute].map((codeToFile) => codeToFile.file)
  const tests = code.codeWriting.testCases

  const result = await runSandbox({
    image: image,
    files: files,
    beforeAll: beforeAll,
    tests: tests,
  })

  res.status(200).send(result)
}

export default withMethodHandler({
  POST: withAuthorization(withPrisma(post), [Role.PROFESSOR]),
})
