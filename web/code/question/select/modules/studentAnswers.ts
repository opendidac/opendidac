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

import { Prisma, StudentPermission } from '@prisma/client'

type OptionSelectWithoutCorrect = Omit<Prisma.OptionSelect, 'isCorrect'>

/**
 * Selects MultipleChoice options relation for student answers. Also used by professors for consulting and grading
 *
 * IMPORTANT: Student answers do NOT duplicate options. Instead, students connect to
 * the question's original options (via relation) to indicate which ones they selected.
 * The `isCorrect` field belongs to the question's options, not the student answer.
 *
 * SAFE: We exclude `isCorrect` here since this select is used for both professors
 * (who need to see correct answers) and students (who should not see correct answers).
 */
const selectMultipleChoiceOptionsSelect = (): OptionSelectWithoutCorrect => {
  return {
    id: true,
    order: true,
    text: true,
  }
}

/**
 * Internal helper for MultipleChoice student answers.
 * Not exported. Not reusable outside this module (for now).
 */
const selectStudentAnswerMultipleChoice =
  (): Prisma.StudentAnswerMultipleChoiceSelect => {
    return {
      comment: true,
      options: {
        select: selectMultipleChoiceOptionsSelect(),
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
      },
    }
  }

/**
 * Internal helper for TrueFalse student answers.
 * Not exported. Not reusable outside this module (for now).
 */
const selectStudentAnswerTrueFalse =
  (): Prisma.StudentAnswerTrueFalseSelect => {
    return {
      isTrue: true,
    }
  }

/**
 * Internal helper for Essay student answers.
 * Not exported. Not reusable outside this module (for now).
 */
const selectStudentAnswerEssay = (): Prisma.StudentAnswerEssaySelect => {
  return {
    content: true,
  }
}

/**
 * Internal helper for CodeWriting file select.
 * Not exported. Not reusable outside this module (for now).
 */
const selectCodeWritingFileSelect =
  (): Prisma.StudentAnswerCodeToFileSelect => {
    return {
      studentPermission: true,
      order: true,
      file: {
        select: {
          id: true,
          updatedAt: true,
          path: true,
          content: true,
          annotation: true,
        },
      },
    }
  }

/**
 * Internal helper for CodeWriting student answers.
 * Not exported. Not reusable outside this module (for now).
 */
const selectStudentAnswerCodeWriting =
  (): Prisma.StudentAnswerCodeWritingSelect => {
    return {
      files: {
        where: {
          studentPermission: {
            not: StudentPermission.HIDDEN,
          },
        },
        select: selectCodeWritingFileSelect(),
        orderBy: { order: 'asc' },
      },
      testCaseResults: true,
      allTestCasesPassed: true,
    }
  }

/**
 * Internal helper for CodeReading snippet select.
 * Not exported. Not reusable outside this module (for now).
 */
const selectCodeReadingSnippetSelect = (): Prisma.CodeReadingSnippetSelect => {
  return {
    id: true,
    snippet: true,
    order: true,
  }
}

/**
 * Internal helper for CodeReading output select.
 * Not exported. Not reusable outside this module (for now).
 */
const selectCodeReadingOutputSelect =
  (): Prisma.StudentAnswerCodeReadingOutputSelect => {
    return {
      output: true,
      status: true,
      codeReadingSnippet: {
        select: selectCodeReadingSnippetSelect(),
      },
    }
  }

/**
 * Internal helper for CodeReading student answers.
 * Not exported. Not reusable outside this module (for now).
 */
const selectStudentAnswerCodeReading =
  (): Prisma.StudentAnswerCodeReadingSelect => {
    return {
      outputs: {
        select: selectCodeReadingOutputSelect(),
        orderBy: {
          codeReadingSnippet: {
            order: 'asc',
          },
        },
      },
    }
  }

/**
 * Internal helper for Code student answers.
 * Not exported. Not reusable outside this module (for now).
 */
const selectStudentAnswerCode = (): Prisma.StudentAnswerCodeSelect => {
  return {
    codeType: true,
    codeWriting: {
      select: selectStudentAnswerCodeWriting(),
    },
    codeReading: {
      select: selectStudentAnswerCodeReading(),
    },
  }
}

/**
 * Internal helper for Web student answers.
 * Not exported. Not reusable outside this module (for now).
 */
const selectStudentAnswerWeb = (): Prisma.StudentAnswerWebSelect => {
  return {
    html: true,
    css: true,
    js: true,
  }
}

/**
 * Internal helper for Database student answers.
 * Not exported. Not reusable outside this module (for now).
 */
const selectStudentAnswerDatabase = (): Prisma.StudentAnswerDatabaseSelect => {
  return {
    queries: {
      include: {
        query: true,
        studentOutput: true,
      },
      orderBy: {
        query: { order: 'asc' },
      },
    },
  }
}

/**
 * Internal helper for ExactMatchField select.
 * Not exported. Not reusable outside this module (for now).
 */
const selectExactMatchFieldSelect = (): Prisma.ExactMatchFieldSelect => {
  return {
    id: true,
    statement: true,
    matchRegex: true,
    order: true,
  }
}

/**
 * Internal helper for ExactMatch student answer field select.
 * Not exported. Not reusable outside this module (for now).
 */
const selectStudentAnswerExactMatchFieldSelect =
  (): Prisma.StudentAnswerExactMatchFieldSelect => {
    return {
      fieldId: true,
      value: true,
      exactMatchField: {
        select: selectExactMatchFieldSelect(),
      },
    }
  }

/**
 * Internal helper for ExactMatch student answers.
 * Not exported. Not reusable outside this module (for now).
 */
const selectStudentAnswerExactMatch =
  (): Prisma.StudentAnswerExactMatchSelect => {
    return {
      fields: {
        select: selectStudentAnswerExactMatchFieldSelect(),
        orderBy: {
          exactMatchField: {
            order: 'asc',
          },
        },
      },
    }
  }

/**
 * Selects all student answer types.
 * Returns the complete studentAnswer select including all answer types.
 */
const selectStudentAnswerSelect = (): Prisma.StudentAnswerSelect => {
  return {
    status: true,
    user: true,

    // ---- MultipleChoice student answers ----
    multipleChoice: {
      select: selectStudentAnswerMultipleChoice(),
    },

    // ---- TrueFalse student answers ----
    trueFalse: {
      select: selectStudentAnswerTrueFalse(),
    },

    // ---- Essay student answers ----
    essay: {
      select: selectStudentAnswerEssay(),
    },

    // ---- Code student answers ----
    code: {
      select: selectStudentAnswerCode(),
    },

    // ---- Web student answers ----
    web: {
      select: selectStudentAnswerWeb(),
    },

    // ---- Database student answers ----
    database: {
      select: selectStudentAnswerDatabase(),
    },

    // ---- ExactMatch student answers ----
    exactMatch: {
      select: selectStudentAnswerExactMatch(),
    },
  }
}

/**
 * Selects all student answers for the professor grading UI.
 * Includes all answer types: MultipleChoice, TrueFalse, Essay, Code, Web, Database, ExactMatch.
 */
export const selectAllStudentAnswers = (): Prisma.QuestionSelect => {
  return {
    studentAnswer: {
      select: selectStudentAnswerSelect(),
    },
  }
}

/**
 * Selects student answers for a specific student (filtered by userEmail).
 * Includes all answer types: MultipleChoice, TrueFalse, Essay, Code, Web, Database, ExactMatch.
 */
export const selectStudentAnswersForUser = (
  userEmail: string,
): Prisma.QuestionSelect => {
  return {
    studentAnswer: {
      where: {
        userEmail: userEmail,
      },
      select: selectStudentAnswerSelect(),
    },
  }
}
