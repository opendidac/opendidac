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
import { withApiContext } from '@/middleware/withApiContext'
import { withAuthorization } from '@/middleware/withAuthorization'
import { withEvaluation } from '@/middleware/withEvaluation'
import type { IApiContextWithEvaluation, IApiContext } from '@/types/api'

import { getUser } from '@/code/auth/auth'

import { loadHandlebars } from '@/code/evaluation/export/engine/handlebars'
import { generatePDF } from '@/code/evaluation/export/engine/pdf'

import {
  StudentSubmission,
  QuestionPayloadStudent,
  UserPayload,
} from '@/code/evaluation/export/engine/types'

import { mapStudentQuestions } from '@/code/evaluation/export/engine/mapQuestions'
import { selectForStudentExport } from '@/code/evaluation/export/engine/select'

// @ts-ignore – template file
import studentMainTemplate from '@/code/evaluation/export/templates/studentMain.hbs'
import muiTheme from '@/code/evaluation/muiTheme.json'

const OUTPUT_FORMAT: 'html' | 'pdf' = 'pdf'

type StudentWithQuestionsAndAnswers = {
  student: UserPayload
  questions: StudentSubmission<QuestionPayloadStudent>[]
}

// ---------------------------------------------------------------------

const get = async (ctx: IApiContextWithEvaluation | IApiContext) => {
  const { req, res, prisma } = ctx
  const { evaluationId } = req.query

  if (!evaluationId || typeof evaluationId !== 'string') {
    return res.status(400).json({ message: 'Invalid evaluationId' })
  }

  // Ensure we have evaluation in context (because of withEvaluation)
  if (!('evaluation' in ctx)) {
    return res.status(500).json({ message: 'Evaluation missing in context' })
  }

  const evaluationCtx = ctx as IApiContextWithEvaluation

  // Get current user
  const user = await getUser(req, res)
  if (!user || !user.email) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const currentEmail = user.email

  // Fetch everything in one query
  const userOnEvaluation = await prisma.userOnEvaluation.findUnique({
    where: {
      userEmail_evaluationId: {
        userEmail: currentEmail,
        evaluationId,
      },
    },
    include: {
      user: true,
      evaluation: {
        include: {
          evaluationToQuestions: {
            select: {
              title: true,
              order: true,
              points: true,
              questionId: true,
              question: {
                select: selectForStudentExport(currentEmail),
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  })

  if (!userOnEvaluation) {
    return res.status(404).json({ message: 'Student not found in evaluation' })
  }

  const student = userOnEvaluation.user

  // Map all questions using shared mapper
  const questions: StudentSubmission<QuestionPayloadStudent>[] =
    userOnEvaluation.evaluation.evaluationToQuestions.map((etq) =>
      mapStudentQuestions(etq, student, currentEmail),
    )

  const studentWithQuestionsAndAnswers: StudentWithQuestionsAndAnswers = {
    student,
    questions,
  }

  // Get small metadata for PDF header
  const evaluationMeta = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    select: {
      id: true,
      label: true,
      conditions: true,
      group: { select: { label: true } },
    },
  })

  // Handlebars context
  const context = {
    includeConditionsPage: !!evaluationMeta?.conditions,
    evaluation: evaluationMeta,
    conditions: evaluationMeta?.conditions,
    studentWithQuestionsAndAnswers,
    muiTheme,
  }

  // Render HTML
  const hbs = loadHandlebars()
  const html = hbs.compile(studentMainTemplate)(context)

  if (OUTPUT_FORMAT === 'html') {
    res.setHeader('Content-Type', 'text/html')
    return res.send(html)
  }

  // Generate PDF
  try {
    const headerText = `${evaluationMeta?.group?.label || 'Evaluation'} – ${
      student.name || student.email
    }`

    const pdf = await generatePDF(html, headerText)

    const fileName = `evaluation_${evaluationMeta?.id || evaluationId}_${currentEmail.replace(
      '@',
      '_at_',
    )}.pdf`

    res.status(200)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.end(Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf))
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error generating PDF' })
  }
}

// ---------------------------------------------------------------------

export default withApiContext({
  GET: withEvaluation(
    withAuthorization(get, {
      roles: [Role.STUDENT, Role.PROFESSOR],
    }),
  ),
})
