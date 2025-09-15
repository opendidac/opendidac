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
import { withPrisma } from '@/middleware/withPrisma'
import {
  withAuthorization,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withRestrictions } from '@/middleware/withRestrictions'
import { getUser } from '@/code/auth/auth'

import puppeteer from 'puppeteer'
import Handlebars from 'handlebars'

import { IncludeStrategy, questionIncludeClause } from '@/code/questions'
import muiTheme from '@/code/evaluation/muiTheme.json'
import {
  countDatabasePassedTests,
  formatMarkdown,
  equals,
  formatQuestionType,
  chunkQuestions,
  calculateTotalPoints,
  calculateObtainedPoints,
  formatCode,
  exactMatchFieldAnswer,
} from '@/code/evaluation/export/helpers'

import studentMainTemplate from '@/code/evaluation/export/templates/studentMain.hbs'
import stylesTemplate from '@/code/evaluation/export/templates/styles.hbs'
import studentCoverTemplate from '@/code/evaluation/export/templates/studentCover.hbs'
import studentTemplate from '@/code/evaluation/export/templates/student.hbs'
import questionTemplate from '@/code/evaluation/export/templates/question.hbs'
import studentAnswerHeaderTemplate from '@/code/evaluation/export/templates/studentAnswerHeader.hbs'
import codeBlocTemplate from '@/code/evaluation/export/templates/codeBloc.hbs'
import studentAnswerCodeWritingTemplate from '@/code/evaluation/export/templates/studentAnswerCodeWriting.hbs'
import studentAnswerCodeReadingTemplate from '@/code/evaluation/export/templates/studentAnswerCodeReading.hbs'
import studentAnswerEssayTemplate from '@/code/evaluation/export/templates/studentAnswerEssay.hbs'
import studentAnswerMultipleChoiceTemplate from '@/code/evaluation/export/templates/studentAnswerMultipleChoice.hbs'
import studentAnswerMultipleChoiceNeutralTemplate from '@/code/evaluation/export/templates/student/studentAnswerMultipleChoiceNeutral.hbs'
import studentAnswerCodeReadingNeutralTemplate from '@/code/evaluation/export/templates/student/studentAnswerCodeReadingNeutral.hbs'
import studentAnswerExactMatchNeutralTemplate from '@/code/evaluation/export/templates/student/studentAnswerExactMatchNeutral.hbs'
import studentAnswerTrueFalseTemplate from '@/code/evaluation/export/templates/studentAnswerTrueFalse.hbs'
import studentAnswerWebTemplate from '@/code/evaluation/export/templates/studentAnswerWeb.hbs'
import studentAnswerDatabaseTemplate from '@/code/evaluation/export/templates/studentAnswerDatabase.hbs'
import gradingTemplate from '@/code/evaluation/export/templates/grading.hbs'
import questionWithSolutionTemplate from '@/code/evaluation/export/templates/questionWithSolution.hbs'
import sectionHeaderTemplate from '@/code/evaluation/export/templates/sectionHeader.hbs'

const OUTPUT_FORMAT = 'pdf' // 'html' or 'pdf'

const generatePDF = async (html, header) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(1800000)

  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 1800000 })

  // Adjust styles for @page directive
  await page.evaluate(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      @page {
        size: A4;
      }
      @page:first {
        @bottom-left { content: ""; }
        @bottom-right { content: ""; }
      }
    `
    document.head.appendChild(style)
  })

  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: {
      bottom: '10mm',
      left: '5mm',
      right: '5mm',
      top: '10mm',
    },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size: 10px; margin: 0 auto;">${header}</div>`,
    footerTemplate:
      '<div style="font-size: 10px; margin: 0 auto;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  })

  await browser.close()
  return pdfBuffer
}

// Register Handlebars templates and helpers
Handlebars.registerPartial('styles', stylesTemplate)
Handlebars.registerPartial('studentInfo', studentTemplate)
Handlebars.registerPartial('studentCover', studentCoverTemplate)
Handlebars.registerPartial('questionHeader', questionTemplate)
Handlebars.registerPartial('codeBloc', codeBlocTemplate)
Handlebars.registerPartial('studentAnswerHeader', studentAnswerHeaderTemplate)
Handlebars.registerPartial(
  'studentAnswerCodeWriting',
  studentAnswerCodeWritingTemplate,
)
Handlebars.registerPartial(
  'studentAnswerCodeReading',
  studentAnswerCodeReadingTemplate,
)
Handlebars.registerPartial('studentAnswerEssay', studentAnswerEssayTemplate)
Handlebars.registerPartial(
  'studentAnswerMultipleChoice',
  studentAnswerMultipleChoiceTemplate,
)
Handlebars.registerPartial(
  'studentAnswerMultipleChoiceNeutral',
  studentAnswerMultipleChoiceNeutralTemplate,
)
Handlebars.registerPartial(
  'studentAnswerCodeReadingNeutral',
  studentAnswerCodeReadingNeutralTemplate,
)
Handlebars.registerPartial(
  'studentAnswerTrueFalse',
  studentAnswerTrueFalseTemplate,
)
Handlebars.registerPartial('studentAnswerWeb', studentAnswerWebTemplate)
Handlebars.registerPartial(
  'studentAnswerDatabase',
  studentAnswerDatabaseTemplate,
)
Handlebars.registerPartial(
  'studentAnswerExactMatchNeutral',
  studentAnswerExactMatchNeutralTemplate,
)

Handlebars.registerPartial('grading', gradingTemplate)
Handlebars.registerPartial('questionWithSolution', questionWithSolutionTemplate)
Handlebars.registerPartial('sectionHeader', sectionHeaderTemplate)

Handlebars.registerHelper('formatCode', formatCode)
Handlebars.registerHelper('formatMarkdown', formatMarkdown)
Handlebars.registerHelper('eq', equals)
Handlebars.registerHelper('formatQuestionType', formatQuestionType)
Handlebars.registerHelper('countDatabasePassedTests', countDatabasePassedTests)
Handlebars.registerHelper('chunkQuestions', chunkQuestions)
Handlebars.registerHelper('calculateTotalPoints', calculateTotalPoints)
Handlebars.registerHelper('calculateObtainedPoints', calculateObtainedPoints)

Handlebars.registerHelper(
  'isOptionSelected',
  function (optionId, selectedOptions) {
    if (!selectedOptions || !Array.isArray(selectedOptions)) return false
    return selectedOptions.some((option) => option.id === optionId)
  },
)

Handlebars.registerHelper('exactMatchFieldAnswer', exactMatchFieldAnswer)

const get = async (req, res, prisma) => {
  const { evaluationId } = req.query

  // Get current user - middleware already handles authentication
  const user = await getUser(req, res)
  const currentUserEmail = user.email

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      evaluationToQuestions: true,
      group: true,
    },
  })

  if (!evaluation) {
    res.status(404).json({ message: 'evaluation not found' })
    return
  }

  // Verify user is enrolled in the evaluation and get all data in one query
  const userOnEvaluation = await prisma.userOnEvaluation.findUnique({
    where: {
      userEmail_evaluationId: {
        userEmail: currentUserEmail,
        evaluationId: evaluationId,
      },
    },
    include: {
      user: true,
      evaluation: {
        include: {
          evaluationToQuestions: {
            include: {
              question: {
                select: questionIncludeClause({
                  includeTypeSpecific: true,
                  includeOfficialAnswers: false, // NO SOLUTIONS for students
                  includeUserAnswers: {
                    strategy: IncludeStrategy.USER_SPECIFIC,
                    userEmail: currentUserEmail,
                  },
                  includeGradings: true,
                }),
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      },
    },
  })

  if (!userOnEvaluation) {
    return res.status(404).json({ message: 'student not found in evaluation' })
  }

  // Build student-specific data structure using the cleaner data from userOnEvaluation
  const studentWithQuestionsAndAnswers = {
    student: userOnEvaluation.user,
    questions: userOnEvaluation.evaluation.evaluationToQuestions.map((etq) => {
      const studentAnswer = etq.question.studentAnswer.find(
        (sa) => sa.user.email === currentUserEmail,
      )

      return {
        student: userOnEvaluation.user,
        question: etq.question,
        order: etq.order + 1,
        points: etq.points,
        studentAnswer,
        studentGrading: studentAnswer?.studentGrading,
      }
    }),
  }

  // Template context for student export
  const context = {
    includeConditionsPage: !!evaluation.conditions,
    evaluation,
    conditions: evaluation.conditions,
    studentWithQuestionsAndAnswers,
    muiTheme,
  }

  const template = Handlebars.compile(studentMainTemplate)
  const combinedHtmlContent = template(context)

  if (OUTPUT_FORMAT === 'html') {
    res.setHeader('Content-Type', 'text/html')
    res.send(combinedHtmlContent)
    return
  }

  try {
    const pdfBuffer = await generatePDF(
      combinedHtmlContent,
      `${evaluation.group.label} - ${userOnEvaluation.user.name || userOnEvaluation.user.email}`,
    )
    const fileName = `evaluation_${evaluation.id}_${currentUserEmail.replace('@', '_at_')}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    res.send(pdfBuffer)
  } catch (error) {
    console.error(error)
    res.status(500).send('Error generating PDF')
  }
}

export default withMethodHandler({
  GET: withRestrictions(
    withAuthorization(withPrisma(get), [Role.STUDENT, Role.PROFESSOR]),
  ),
})
