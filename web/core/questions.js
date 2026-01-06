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
  QuestionType,
  StudentPermission,
  CodeQuestionType,
} from '@prisma/client'

export const IncludeStrategy = {
  ALL: 'all',
  USER_SPECIFIC: 'user_specific',
}

/*
CAUTION: questionIncludeClause is a heavily used function
any change to it should be carefully considered
Make sure to test all the use cases
*/
const defaultQuestionSelectClause = {
  includeProfessorOnlyInfo: false,
  includeTypeSpecific: true,
  includeOfficialAnswers: false,
  includeUserAnswers: undefined, // { strategy: IncludeStrategy.USER_SPECIFIC, userEmail: <email> } or { strategy: IncludeStrategy.ALL }
  includeGradings: false,
  includeTags: true,
}

/*
    question is the question object from the request body
    question can be null if we are creating a new question
    using this function we can extract the type specific data (and only that) from the question object
    also used to avoid injections
 */

export const questionTypeSpecific = (
  questionType,
  question,
  mode = 'update',
) => {
  switch (questionType) {
    case QuestionType.trueFalse:
      return {
        isTrue: question?.trueFalse.isTrue ?? true,
      }
    case QuestionType.web:
      return {
        solutionHtml: question?.web.solutionHtml ?? '',
        solutionCss: question?.web.solutionCss ?? '',
        solutionJs: question?.web.solutionJs ?? '',
        templateHtml: question?.web.templateHtml ?? '',
        templateCss: question?.web.templateCss ?? '',
        templateJs: question?.web.templateJs ?? '',
      }
    case QuestionType.essay:
      return {
        solution: question?.essay.solution ?? '',
        template: question?.essay.template ?? '',
      }
    case QuestionType.multipleChoice:
      // console.log(utils.inspect(question, { showHidden: false, depth: null }))

      return !question
        ? {
            // default options when creating a new question
            options: {
              create: [
                { text: 'Option 1', isCorrect: false, order: 0 },
                { text: 'Option 2', isCorrect: true, order: 1 },
              ],
            },
          }
        : {
            gradingPolicy: question.multipleChoice.gradingPolicy,
            activateStudentComment:
              question.multipleChoice.activateStudentComment,
            studentCommentLabel: question.multipleChoice.studentCommentLabel,
            activateSelectionLimit:
              question.multipleChoice.activateSelectionLimit,
            selectionLimit: question.multipleChoice.selectionLimit,
            options:
              mode === 'update'
                ? // multi choice options are no longer managed on the question level, they are managed by individual endpoints : api/questions/:id/multiple-choice/options
                  {}
                : // the only use case for mode === "create" is when we are copying questions for a evaluation, see api/evaluation [POST]
                  {
                    create: question.multipleChoice.options.map((o) => ({
                      order: o.order,
                      text: o.text,
                      isCorrect: o.isCorrect,
                    })),
                  },
          }
    case QuestionType.exactMatch:
      return !question
        ? {
            // default fields when creating a new question
            fields: {
              create: [
                {
                  order: 0,
                  statement:
                    'What is the answer to life, the universe and everything?',
                  matchRegex: '42',
                },
                {
                  order: 1,
                  statement: 'Provide a strictly positive even number below 9.',
                  matchRegex: '[2468]',
                },
                {
                  order: 2,
                  statement: 'What is the currency of the United States?',
                  matchRegex: '/dollar(s)?|usd/gi',
                },
              ],
            },
          }
        : {
            fields:
              mode === 'update'
                ? // exact answer fields are managed on the question level for now
                  {}
                : // for copying questions
                  {
                    create: question.exactMatch.fields.map((field) => ({
                      order: field.order,
                      statement: field.statement,
                      matchRegex: field.matchRegex,
                    })),
                  },
          }
    default:
      return {}
  }
}

const buildCodeWritingUpdate = (
  questionId,
  { testCases, files, codeCheckEnabled },
) => ({
  create: {
    codeCheckEnabled: codeCheckEnabled ?? true,
    testCases: {
      create: testCases.map(({ exec, input, expectedOutput }, index) => ({
        index: index + 1,
        exec,
        input,
        expectedOutput,
      })),
    },
    solutionFiles: {
      create: files.solution.map(({ path, content }, index) => ({
        order: index,
        file: {
          create: {
            path,
            content,
            code: {
              connect: { questionId },
            },
          },
        },
      })),
    },
    templateFiles: {
      create: files.template.map(
        ({ path, content, studentPermission }, index) => ({
          order: index,
          studentPermission: studentPermission
            ? studentPermission
            : StudentPermission.UPDATE,
          file: {
            create: {
              path,
              content,
              code: {
                connect: { questionId },
              },
            },
          },
        }),
      ),
    },
  },
})

// Function to create the structure for codeReading specifics
const buildCodeReadingUpdate = ({
  contextExec,
  contextPath,
  context,
  snippets,
}) => ({
  create: {
    contextExec,
    contextPath,
    context,
    snippets: {
      create: snippets.map(({ snippet, output }, order) => ({
        order,
        snippet,
        output,
      })),
    },
  },
})

// Main function to build the initial update query
export const codeInitialUpdateQuery = (questionId, code, codeQuestionType) => {
  // Common data structure
  const updateQuery = {
    where: { questionId },
    data: {
      language: code.language,
      sandbox: code.sandbox
        ? {
            create: {
              image: code.sandbox.image,
              beforeAll: code.sandbox.beforeAll,
            },
          }
        : undefined,
      codeType: codeQuestionType,
      [codeQuestionType]:
        codeQuestionType === CodeQuestionType.codeWriting
          ? buildCodeWritingUpdate(questionId, code)
          : buildCodeReadingUpdate(code),
      question: {
        connect: { id: questionId },
      },
    },
  }

  return updateQuery
}
