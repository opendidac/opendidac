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
} from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import { getUser } from '@/core/auth/auth'

/** Create the annotation for a student answer
 *
 * Used by the page Evaluation Grading
 * 
 * 
model Annotation {
  // This model should be used to store annotations for a specific student answer
  // It should be used for a number of different types of questions, thus having an auto-incrementing id (main entity) raher than a composite key

  id             String   @id @default(cuid())
  
  studentAnswer  StudentAnswer @relation(fields: [userEmail, questionId], references: [userEmail, questionId], onDelete: Cascade)
  userEmail      String
  questionId     String

  entityType     AnnotationEntityType @default(CODE_WRITING_FILE)
  
  // When attached to student code file
  fileId         String?  @unique
  file           File?    @relation(fields: [fileId], references: [id])

  content        String   
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  createdBy      User?    @relation(fields: [createdById], references: [id])
  createdById    String?

  @@unique([userEmail, questionId, fileId])
}
 */

const put = async (req, res, ctx) => {
  const { prisma } = ctx
  const { annotation } = req.body

  const user = await getUser(req, res)

  const { annotationId } = req.query

  const updatedAnnotation = await prisma.annotation.update({
    where: {
      id: annotationId,
    },
    data: {
      content: annotation.content,
      createdBy: {
        connect: {
          id: user.id,
        },
      },
    },
  })

  res.status(200).json(updatedAnnotation)
}

const del = async (req, res, ctx) => {
  const { prisma } = ctx
  const { annotationId } = req.query

  await prisma.annotation.delete({
    where: {
      id: annotationId,
    },
  })

  res.status(200).json({ success: true })
}

export default withApiContext({
  PUT: withGroupScope(withAuthorization(put, { roles: [Role.PROFESSOR] })),
  DELETE: withGroupScope(withAuthorization(del, { roles: [Role.PROFESSOR] })),
})
