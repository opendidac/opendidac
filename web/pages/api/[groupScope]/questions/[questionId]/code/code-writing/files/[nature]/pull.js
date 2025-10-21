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
import { Role, StudentPermission } from '@prisma/client'

import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'
import { withQuestionUpdate } from '@/middleware/withUpdate'

/**
 *
 * Pull the solution files from the code question to the template files
 * Pull deletes any existing template files and replaces them with the solution files
 */

const post = async (req, res, prisma) => {
  // copy solution files to template files

  const { questionId, nature } = req.query

  if (nature !== 'solution') {
    res.status(400).json({ message: 'Bad request' })
    return
  }

  const codeToFiles = await prisma.codeToSolutionFile.findMany({
    where: {
      questionId,
    },
    include: {
      file: true,
    },
  })

  if (!codeToFiles) res.status(404).json({ message: 'Not found' })

  const newCodeToFiles = []

  await prisma.$transaction(async (prisma) => {
    /*
        delete any existing template files, there is no ownership relation between codeToTemplateFile and file
        so we have to select the files first and then delete them
      */

    const filesToDelete = await prisma.codeToTemplateFile.findMany({
      where: { questionId },
      include: {
        file: true,
      },
    })

    for (const file of filesToDelete) {
      await prisma.file.delete({
        where: {
          id: file.file.id,
        },
      })
    }
    // create new template files
    for (const codeToFile of codeToFiles) {
      let newCodeToFile = await prisma.codeToTemplateFile.create({
        data: {
          studentPermission: StudentPermission.UPDATE,
          order: codeToFile.order,
          file: {
            create: {
              path: codeToFile.file.path,
              content: codeToFile.file.content,
              code: {
                connect: { questionId },
              },
            },
          },
          code: {
            connect: {
              questionId,
            },
          },
        },
        include: {
          file: true,
        },
      })
      newCodeToFiles.push(newCodeToFile)
    }
  })

  res.status(200).json(newCodeToFiles || [])
}

export default withMethodHandler({
  POST: withAuthorization(
    withGroupScope(withQuestionUpdate(withPrisma(post))),
    [Role.PROFESSOR],
  ),
})
