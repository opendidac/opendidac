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
  QuestionSource,
  CodeQuestionType,
  QuestionUsageStatus,
} from '@prisma/client'
import { buildQuestionSelect } from './question/select/buildQuestionSelect'
import { IncludeStrategy } from './question/select/utils/types'

// Re-export IncludeStrategy for backward compatibility
export { IncludeStrategy }

// Export use-case-specific functions
export {
  selectForProfessorEditing,
  selectForProfessorListing,
  selectForProfessorProgressTracking,
  selectForProfessorResults,
  selectForProfessorEvaluationQuestions,
  selectForProfessorAddingToEvaluation,
  selectForProfessorEvaluationQuestionsWithGradings,
  selectForProfessorCopying,
  selectForEvaluationPhaseCopy,
  selectForStudentJoining,
  selectForStudentExport,
  selectForStudentConsultation,
  selectForProfessorExport,
  selectForProfessorConsultingStudent,
  selectForQuestionExport,
} from './question/select/useCases'

/*
CAUTION: questionSelectClause is a heavily used function
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

/**
 * Builds a Prisma select clause for questions based on provided options
 * Now uses the composable builder architecture for maintainability
 */
export const questionSelectClause = (questionSelectOptions) => {
  // Merge with defaults and build the select clause
  const options = { ...defaultQuestionSelectClause, ...questionSelectOptions }

  return buildQuestionSelect(options)
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

/**
 * Deep copy a question and its type-specific data.
 * @param {PrismaClient} prisma
 * @param {Object} question
 * @param {string} source
 */
export const copyQuestion = async (
  prisma,
  question,
  source = QuestionSource.EVAL,
  appendCopyInTitle = false,
) => {
  const data = {
    title: appendCopyInTitle ? `Copy of ${question.title}` : question.title,
    content: question.content,
    type: question.type,
    usageStatus:
      source === QuestionSource.EVAL
        ? QuestionUsageStatus.NOT_APPLICABLE
        : QuestionUsageStatus.UNUSED,
    scratchpad: question.scratchpad,
    group: {
      connect: {
        id: question.groupId,
      },
    },
    questionToTag: {
      create: question.questionToTag.map((qTag) => ({
        tag: {
          connect: {
            groupId_label: {
              groupId: question.groupId,
              label: qTag.tag.label,
            },
          },
        },
      })),
    },
    source: source,
    sourceQuestion: {
      connect: {
        id: question.id,
      },
    },
  }

  const copyGenericQuestion = async (prisma, question) => {
    const newQuestion = await prisma.question.create({
      data: {
        ...data,
        [question.type]: {
          create: questionTypeSpecific(question.type, question, 'create'),
        },
      },
    })
    return newQuestion
  }

  const copyCodeQuestion = async (prisma, question) => {
    const query = {
      data: {
        ...data,
        code: {
          create: {
            language: question.code.language,
            codeType: question.code.codeType,
            sandbox: {
              create: {
                image: question.code.sandbox.image,
                beforeAll: question.code.sandbox.beforeAll,
              },
            },
          },
        },
      },
    }

    let newCodeQuestion = undefined

    switch (question.code.codeType) {
      // create the copy of the code writing question
      case CodeQuestionType.codeWriting: {
        query.data.code.create.codeWriting = {
          create: {
            codeCheckEnabled:
              question.code.codeWriting.codeCheckEnabled ?? true,
            testCases: {
              create: question.code.codeWriting.testCases.map((testCase) => ({
                index: testCase.index,
                exec: testCase.exec,
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
              })),
            },
          },
        }

        newCodeQuestion = await prisma.question.create(query)

        // create the copy of template and solution files and link them to the new code questions

        for (const codeToFile of question.code.codeWriting.templateFiles) {
          const newFile = await prisma.file.create({
            data: {
              path: codeToFile.file.path,
              content: codeToFile.file.content,
              createdAt: codeToFile.file.createdAt, // for deterministic ordering
              code: {
                connect: {
                  questionId: newCodeQuestion.id,
                },
              },
            },
          })
          await prisma.codeToTemplateFile.create({
            data: {
              questionId: newCodeQuestion.id,
              fileId: newFile.id,
              order: codeToFile.order,
              studentPermission: codeToFile.studentPermission,
            },
          })
        }

        for (const codeToFile of question.code.codeWriting.solutionFiles) {
          const newFile = await prisma.file.create({
            data: {
              path: codeToFile.file.path,
              content: codeToFile.file.content,
              createdAt: codeToFile.file.createdAt, // for deterministic ordering
              code: {
                connect: {
                  questionId: newCodeQuestion.id,
                },
              },
            },
          })
          await prisma.codeToSolutionFile.create({
            data: {
              questionId: newCodeQuestion.id,
              fileId: newFile.id,
              order: codeToFile.order,
              studentPermission: codeToFile.studentPermission,
            },
          })
        }
        break
      }
      case CodeQuestionType.codeReading: {
        query.data.code.create.codeReading = {
          create: {
            contextExec: question.code.codeReading.contextExec,
            contextPath: question.code.codeReading.contextPath,
            context: question.code.codeReading.context,
            studentOutputTest: question.code.codeReading.studentOutputTest,
            snippets: {
              create: question.code.codeReading.snippets.map((snippet) => ({
                order: snippet.order,
                snippet: snippet.snippet,
                output: snippet.output,
              })),
            },
          },
        }

        newCodeQuestion = await prisma.question.create(query)

        break
      }
    }

    return newCodeQuestion
  }

  const copyDatabaseQuestion = async (prisma, question) => {
    const newDatabaseQuestion = await prisma.question.create({
      data: {
        ...data,
        database: {
          create: {
            image: question.database.image,
          },
        },
      },
    })

    for (const solQuery of question.database.solutionQueries) {
      const query = solQuery.query
      const output = solQuery.output

      const newQuery = await prisma.databaseQuery.create({
        data: {
          order: query.order,
          title: query.title,
          description: query.description,
          content: query.content,
          template: query.template,
          lintActive: query.lintActive,
          lintRules: query.lintRules,
          studentPermission: query.studentPermission,
          testQuery: query.testQuery,
          queryOutputTests: {
            create: query.queryOutputTests.map((test) => ({
              test: test.test,
            })),
          },
          database: {
            connect: {
              questionId: newDatabaseQuestion.id,
            },
          },
        },
      })

      let newQueryOutput = undefined

      if (output) {
        newQueryOutput = await prisma.databaseQueryOutput.create({
          data: {
            output: output.output,
            status: output.status,
            type: output.type,
            dbms: output.dbms,
            query: {
              connect: {
                id: newQuery.id,
              },
            },
          },
        })
      }

      await prisma.databaseToSolutionQuery.create({
        data: {
          questionId: newDatabaseQuestion.id,
          queryId: newQuery.id,
          outputId: newQueryOutput?.id,
        },
      })
    }

    return newDatabaseQuestion
  }

  switch (question.type) {
    case QuestionType.essay:
    case QuestionType.multipleChoice:
    case QuestionType.trueFalse:
    case QuestionType.web:
    case QuestionType.exactMatch:
      return copyGenericQuestion(prisma, question)
    case QuestionType.code:
      return copyCodeQuestion(prisma, question)
    case QuestionType.database:
      return copyDatabaseQuestion(prisma, question)
    default:
      return null
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
