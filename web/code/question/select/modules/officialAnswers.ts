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

import { Prisma } from '@prisma/client'

/**
 * Official MCQ-sensitive data: isCorrect
 * Only used inside professor/editor contexts.
 */
type OptionSelectCorrectOnly = Pick<Prisma.OptionSelect, 'isCorrect'>

/**
 * Helper to expose sensitive option fields.
 */
const selectMultipleChoiceOptionsSelect = (): OptionSelectCorrectOnly => {
  return {
    isCorrect: true,
  }
}

/**
 * Selects the official answers *inside the multipleChoice relation only*.
 * This returns a valid Prisma.MultipleChoiceSelect.
 */
export const selectOfficialAnswersMultipleChoice =
  (): Prisma.MultipleChoiceSelect => {
    return {
      options: {
        select: selectMultipleChoiceOptionsSelect(),
      },
    }
  }

/**
 * Selects the official answers *inside the trueFalse relation only*.
 * This returns a valid Prisma.TrueFalseSelect.
 */
export const selectOfficialAnswersTrueFalse = (): Prisma.TrueFalseSelect => {
  return {
    isTrue: true,
  }
}

/**
 * Selects the official answers *inside the essay relation only*.
 * This returns a valid Prisma.EssaySelect.
 */
export const selectOfficialAnswersEssay = (): Prisma.EssaySelect => {
  return {
    solution: true,
  }
}

/**
 * Selects the official answers *inside the web relation only*.
 * This returns a valid Prisma.WebSelect.
 */
export const selectOfficialAnswersWeb = (): Prisma.WebSelect => {
  return {
    solutionHtml: true,
    solutionCss: true,
    solutionJs: true,
  }
}

/**
 * Selects the official answers *inside the exactMatchField relation only*.
 * This returns a valid Prisma.ExactMatchFieldSelect.
 */
const selectExactMatchFieldOfficialAnswers =
  (): Prisma.ExactMatchFieldSelect => {
    return {
      matchRegex: true,
    }
  }

/**
 * Selects the official answers *inside the exactMatch relation only*.
 * This returns a valid Prisma.ExactMatchSelect.
 */
export const selectOfficialAnswersExactMatch = (): Prisma.ExactMatchSelect => {
  return {
    fields: {
      select: selectExactMatchFieldOfficialAnswers(),
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    },
  }
}

/**
 * Selects the official answers *inside the codeWriting relation only*.
 * This returns a valid Prisma.CodeWritingSelect.
 */
export const selectOfficialAnswersCodeWriting =
  (): Prisma.CodeWritingSelect => {
    return {
      solutionFiles: {
        include: { file: true },
        orderBy: { order: 'asc' },
      },
    }
  }

/**
 * Selects the official answers *inside the codeReading relation only*.
 * This returns a valid Prisma.CodeReadingSelect.
 */
export const selectOfficialAnswersCodeReading =
  (): Prisma.CodeReadingSelect => {
    return {
      studentOutputTest: true,
      contextExec: true,
      contextPath: true,
      context: true,
      snippets: {
        select: {
          output: true,
        },
        orderBy: { order: 'asc' },
      },
    }
  }

/**
 * Selects the official answers *inside the code relation only*.
 * This returns a valid Prisma.CodeSelect.
 */
export const selectOfficialAnswersCode = (): Prisma.CodeSelect => {
  return {
    codeWriting: {
      select: selectOfficialAnswersCodeWriting(),
    },
    codeReading: {
      select: selectOfficialAnswersCodeReading(),
    },
  }
}

/**
 * Selects the official answers *inside the database relation only*.
 * This returns a valid Prisma.DatabaseSelect.
 */
export const selectOfficialAnswersDatabase = (): Prisma.DatabaseSelect => {
  return {
    solutionQueries: {
      include: {
        query: true,
        output: true,
      },
      orderBy: {
        query: { order: 'asc' },
      },
    },
  }
}

/**
 * Selects official answers for all question types at the Question level.
 * This returns a valid Prisma.QuestionSelect.
 */
export const selectOfficialAnswers = (): Prisma.QuestionSelect => {
  return {
    multipleChoice: {
      select: selectOfficialAnswersMultipleChoice(),
    },
    trueFalse: {
      select: selectOfficialAnswersTrueFalse(),
    },
    essay: {
      select: selectOfficialAnswersEssay(),
    },
    web: {
      select: selectOfficialAnswersWeb(),
    },
    exactMatch: {
      select: selectOfficialAnswersExactMatch(),
    },
    code: {
      select: selectOfficialAnswersCode(),
    },
    database: {
      select: selectOfficialAnswersDatabase(),
    },
  }
}
