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

import type { NextApiRequest, NextApiResponse } from 'next'
import { Role } from '@prisma/client'
import { withApiContext } from '@/middleware/withApiContext'
import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import type { IApiContext } from '@/core/types/api'

import { loadHandlebars } from '@/core/evaluation/export/engine/handlebars'
import { generatePDF } from '@/core/evaluation/export/engine/pdf'

import {
  QuestionPayloadProfessor,
  StudentSubmission,
  UserPayload,
  QuestionWithMeta,
} from '@/core/evaluation/export/engine/types'

import { mapProfessorQuestion } from '@/core/evaluation/export/engine/mapProfessorQuestions'
import { mapStudentSubmission } from '@/core/evaluation/export/engine/mapStudentSubmissions'

import { selectForProfessorExport } from '@/core/evaluation/export/engine/select'

// @ts-ignore
import mainTemplate from '@/core/evaluation/export/templates/main.hbs'
import muiTheme from '@/core/evaluation/muiTheme.json'

const OUTPUT_FORMAT = 'pdf' as 'html' | 'pdf'

// ----------------------------------------------------------

const get = async (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: IApiContext,
) => {
  const { prisma } = ctx
  const { evaluationId, groupScope } = req.query

  if (typeof evaluationId !== 'string')
    return res.status(400).json({ message: 'Invalid evaluationId' })

  if (typeof groupScope !== 'string')
    return res.status(400).json({ message: 'Invalid groupScope' })

  // Load evaluation skeleton
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      evaluationToQuestions: true,
      students: { select: { user: true } },
      group: true,
    },
  })

  if (!evaluation)
    return res.status(404).json({ message: 'evaluation not found' })

  const includeStudentSubmissions = !evaluation.purgedAt

  // Fetch questions with professor select clause
  const questions = await prisma.evaluationToQuestion.findMany({
    where: {
      evaluationId,
      question: { group: { scope: groupScope } },
    },
    select: {
      title: true,
      order: true,
      points: true,
      gradingPoints: true,
      questionId: true,
      question: {
        select: selectForProfessorExport(includeStudentSubmissions),
      },
    },
    orderBy: { order: 'asc' },
  })

  // 1. Solutions section (prof-only)
  const questionsWithSolutions: QuestionWithMeta<QuestionPayloadProfessor>[] =
    questions.map((etq) => mapProfessorQuestion(etq))

  // 2. Student submissions (only if not purged)
  let studentsWithQuestionsAndAnswers: Array<{
    student: UserPayload
    questions: StudentSubmission<QuestionPayloadProfessor>[]
  }> = []

  if (includeStudentSubmissions) {
    studentsWithQuestionsAndAnswers = evaluation.students
      .filter((studentObj) => studentObj.user.email !== null)
      .map((studentObj) => {
        const student = studentObj.user

        const qList = questions.map((etq) =>
          mapStudentSubmission<QuestionPayloadProfessor>(
            etq,
            student,
            student.email!, // Safe because we filtered out null emails
          ),
        )

        return { student, questions: qList }
      })
  }

  // Template context
  const context = {
    includeConditionsPage: !!evaluation.conditions,
    includeSectionTwo: false,
    includeStudentSubmissions,
    evaluation,
    studentsCount: evaluation.students.length,
    conditions: evaluation.conditions,
    questionsWithSolutions,
    studentsWithQuestionsAndAnswers,
    muiTheme,
  }

  // Render HTML
  const hbs = loadHandlebars()
  const html = hbs.compile(mainTemplate)(context)

  if (OUTPUT_FORMAT === 'html') {
    res.setHeader('Content-Type', 'text/html')
    return res.send(html)
  }

  // Generate PDF
  try {
    const headerText = `${evaluation.group.label} – Solutions`
    const pdf = await generatePDF(html, headerText)

    res.status(200)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="evaluation_${evaluation.id}.pdf"`,
    )
    res.end(Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Error generating PDF' })
  }
}

// ----------------------------------------------------------

export default withApiContext({
  GET: withGroupScope(
    withAuthorization(get, {
      roles: [Role.PROFESSOR, Role.ARCHIVIST],
    }),
  ),
})
