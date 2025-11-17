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
import { withMethodHandler } from '@/middleware/withMethodHandler'
import { withPrisma } from '@/middleware/withPrisma'
import { getUser } from '@/code/auth/auth'

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

  @@unique([entityType, fileId])
}
 */

const get = async (ctx) => {
  const { req, res, prisma } = ctx
  const { entityType, entityId } = req.query

  const annotation = await prisma.annotation.findUnique({
    where: {
      entityType_fileId: {
        entityType: entityType,
        fileId: entityId,
      },
    },
  })

  res.status(200).json(annotation)
}

const post = async (ctx) => {
  const { req, res, prisma } = ctx
  const { student, question, annotation, entityType, entity } = req.body

  const user = await getUser(req, res)

  const exists = await prisma.annotation.findUnique({
    where: {
      entityType_fileId: {
        entityType: entityType,
        fileId: entity.id,
      },
    },
  })

  if (exists) {
    return res.status(400).json({ message: 'Annotation already exists' })
  }

  const newAnnotation = await prisma.annotation.create({
    data: {
      userEmail: student.email,
      questionId: question.id,
      entityType: entityType,
      fileId: entity.id,
      content: annotation.content,
      createdById: user.id,
    },
  })

  res.status(200).json(newAnnotation)
}

export default withMethodHandler({
  GET: withGroupScope(
    withAuthorization(withPrisma(get), { roles: [Role.PROFESSOR] }),
  ),
  POST: withGroupScope(
    withAuthorization(withPrisma(post), { roles: [Role.PROFESSOR] }),
  ),
})
