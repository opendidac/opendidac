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
  CodeQuestionType,
  QuestionType,
  StudentAnswerCodeReadingOutputStatus,
  StudentAnswerStatus,
  StudentQuestionGradingStatus,
} from '@prisma/client'
import { regexpFromPattern } from '@/code/utils'

export const getSignedSuccessRate = (evaluationToQuestions) => {
  // total signed points
  let totalSignedPoints = evaluationToQuestions.reduce((acc, jstq) => {
    let signedGradings = jstq.question.studentAnswer.filter(
      (sa) => sa.studentGrading.signedBy,
    ).length
    return acc + signedGradings * jstq.points
  }, 0)
  // total signed obtained points
  let totalSignedObtainedPoints = evaluationToQuestions.reduce(
    (acc, jstq) =>
      acc +
      jstq.question.studentAnswer
        .filter((sa) => sa.studentGrading.signedBy)
        .reduce((acc, sa) => acc + sa.studentGrading.pointsObtained, 0),
    0,
  )
  return totalSignedPoints > 0
    ? Math.round((totalSignedObtainedPoints / totalSignedPoints) * 100)
    : 0
}

export const getObtainedPoints = (evaluationToQuestions, participant) => {
  return evaluationToQuestions.reduce((acc, { question }) => {
    let studentGrading = question.studentAnswer.find(
      (sa) => sa.user.id === participant.id,
    ).studentGrading
    return acc + (studentGrading ? studentGrading.pointsObtained : 0)
  }, 0)
}
export const getGradingStats = (evaluationToQuestions) => {
  let totalGradings = evaluationToQuestions.reduce(
    (acc, jstq) => acc + jstq.question.studentAnswer.length,
    0,
  )
  let totalSigned = evaluationToQuestions.reduce(
    (acc, jstq) =>
      acc +
      jstq.question.studentAnswer.filter((sa) => sa.studentGrading.signedBy)
        .length,
    0,
  )
  let totalAutogradedUnsigned = evaluationToQuestions.reduce(
    (acc, jstq) =>
      acc +
      jstq.question.studentAnswer.filter(
        (sa) =>
          sa.studentGrading.status ===
            StudentQuestionGradingStatus.AUTOGRADED &&
          !sa.studentGrading.signedBy,
      ).length,
    0,
  )

  return {
    totalGradings,
    totalSigned,
    totalAutogradedUnsigned,
  }
}

export const getQuestionSuccessRate = (evaluationToQuestions) => {
  const { question } = evaluationToQuestions
  let totalPoints = evaluationToQuestions.points * question.studentAnswer.length
  let totalObtainedPoints = question.studentAnswer.reduce(
    (acc, sa) => acc + sa.studentGrading.pointsObtained,
    0,
  )

  return totalPoints > 0
    ? Math.round((totalObtainedPoints / totalPoints) * 100)
    : 0
}

export const typeSpecificStats = (question) => {
  switch (question.type) {
    case QuestionType.multipleChoice:
      return question[question.type].options.map((option, index) => {
        // number of times this option was selected in users answers
        let chosen = question.studentAnswer.reduce((acc, sa) => {
          if (sa.status !== StudentAnswerStatus.MISSING) {
            let isChosen = sa[question.type].options.some(
              (o) => o.id === option.id,
            )
            if (isChosen) {
              return acc + 1
            }
          }
          return acc
        }, 0)
        return {
          label: `O${index + 1}`,
          text: option.text,
          tooltip: option.text,
          isCorrect: option.isCorrect,
          chosen,
        }
      })
    case QuestionType.trueFalse:
      let trueChosen = question.studentAnswer.reduce((acc, sa) => {
        if (
          sa.status !== StudentAnswerStatus.MISSING &&
          sa[question.type].isTrue
        ) {
          return acc + 1
        }
        return acc
      }, 0)
      let falseChosen = question.studentAnswer.reduce((acc, sa) => {
        if (
          sa.status !== StudentAnswerStatus.MISSING &&
          !sa[question.type].isTrue
        ) {
          return acc + 1
        }
        return acc
      }, 0)
      return {
        true: {
          chosen: trueChosen,
          isTrue: question.trueFalse.isTrue,
        },
        false: {
          chosen: falseChosen,
          isTrue: !question.trueFalse.isTrue,
        },
      }
    case QuestionType.code:
      const codeType = question.code.codeType
      switch (codeType) {
        case CodeQuestionType.codeReading:
          return calculateCodeReadingStats(question)
        case CodeQuestionType.codeWriting:
          return calculateCodeWritingStats(question)
        default:
          return null
      }
    case QuestionType.essay:
    case QuestionType.web:
      let submitted = question.studentAnswer.reduce((acc, sa) => {
        if (sa.status !== StudentAnswerStatus.MISSING) {
          return acc + 1
        }
        return acc
      }, 0)
      let missing = question.studentAnswer.reduce((acc, sa) => {
        if (sa.status === StudentAnswerStatus.MISSING) {
          return acc + 1
        }
        return acc
      }, 0)
      return {
        submitted: {
          count: submitted,
        },
        missing: {
          count: missing,
        },
      }
    case QuestionType.database:
      const testQueries = question.database.solutionQueries.filter(
        (sq) => sq.query.testQuery,
      )
      const lintQueries = question.database.solutionQueries.filter(
        (sq) => sq.query.lintRules,
      )

      const testQueriesStats = []
      const lintQueriesStats = []

      for (const testQuery of testQueries) {
        const testSuccesses = question.studentAnswer.reduce((acc, sa) => {
          const studentQuery = sa.database.queries.find(
            (saQ) => saQ.query.order === testQuery.query.order,
          )
          if (studentQuery.studentOutput?.output.testPassed) {
            return acc + 1
          }
          return acc
        }, 0)

        const testFailures = question.studentAnswer.reduce((acc, sa) => {
          const studentQuery = sa.database.queries.find(
            (saQ) => saQ.query.order === testQuery.query.order,
          )
          if (!studentQuery.studentOutput?.output.testPassed) {
            return acc + 1
          }
          return acc
        }, 0)

        testQueriesStats.push({
          order: testQuery.query.order,
          title: testQuery.query.title,
          testSuccesses,
          testFailures,
        })
      }

      for (const lintQuery of lintQueries) {
        const lintSuccesses = question.studentAnswer.reduce((acc, sa) => {
          const studentQuery = sa.database.queries.find(
            (saQ) => saQ.query.order === lintQuery.query.order,
          )
          if (studentQuery.query.lintResult?.violations.length === 0) {
            return acc + 1
          }
          return acc
        }, 0)

        const lintFailures = question.studentAnswer.reduce((acc, sa) => {
          const studentQuery = sa.database.queries.find(
            (saQ) => saQ.query.order === lintQuery.query.order,
          )
          if (
            !studentQuery.query.lintResult ||
            studentQuery.query.lintResult?.violations.length > 0
          ) {
            return acc + 1
          }
          return acc
        }, 0)

        lintQueriesStats.push({
          order: lintQuery.query.order,
          title: lintQuery.query.title,
          lintSuccesses,
          lintFailures,
        })
      }

      return {
        testQueriesStats,
        lintQueriesStats,
      }
    case QuestionType.exactMatch:
      return calculateExactMatchStats(question)
    default:
      return null
  }
}

const calculateCodeWritingStats = (question) => {
  let success = question.studentAnswer.reduce((acc, sa) => {
    if (
      sa.status !== StudentAnswerStatus.MISSING &&
      sa.code.codeWriting?.testCaseResults?.length > 0 &&
      sa.code.codeWriting.allTestCasesPassed
    ) {
      return acc + 1
    }
    return acc
  }, 0)

  let failure = question.studentAnswer.reduce((acc, sa) => {
    if (
      sa.status !== StudentAnswerStatus.MISSING &&
      sa.code.codeWriting?.testCaseResults?.length > 0 &&
      !sa.code.codeWriting.allTestCasesPassed
    ) {
      return acc + 1
    }
    return acc
  }, 0)

  let noCodeCheckRuns = question.studentAnswer.reduce((acc, sa) => {
    if (
      sa.status !== StudentAnswerStatus.MISSING &&
      !sa.code.codeWriting?.testCaseResults?.length
    ) {
      return acc + 1
    }
    return acc
  }, 0)

  return {
    success: { count: success },
    failure: { count: failure },
    noCodeCheckRuns: { count: noCodeCheckRuns },
  }
}

const calculateCodeReadingStats = (question) => {
  let success = question.studentAnswer.reduce((acc, sa) => {
    if (
      sa.status !== StudentAnswerStatus.MISSING &&
      sa.code.codeReading?.outputs.every(
        (output) =>
          output.status === StudentAnswerCodeReadingOutputStatus.MATCH,
      )
    ) {
      return acc + 1
    }
    return acc
  }, 0)

  let failure = question.studentAnswer.reduce((acc, sa) => {
    if (
      sa.status !== StudentAnswerStatus.MISSING &&
      sa.code.codeReading?.outputs.some(
        (output) =>
          output.status === StudentAnswerCodeReadingOutputStatus.MISMATCH,
      )
    ) {
      return acc + 1
    }
    return acc
  }, 0)

  let unanswered = question.studentAnswer.reduce((acc, sa) => {
    if (
      sa.status !== StudentAnswerStatus.MISSING &&
      sa.code.codeReading?.outputs.every(
        (output) =>
          output.status === StudentAnswerCodeReadingOutputStatus.NEUTRAL,
      )
    ) {
      return acc + 1
    }
    return acc
  }, 0)
  return {
    success: { count: success },
    failure: { count: failure },
    unanswered: { count: unanswered },
  }
}

const calculateExactMatchStats = (question) => {
  let regexps = new Map()
  let perFieldStats = []
  let perFieldIndex = new Map()

  question.exactMatch.fields.forEach((field, index) => {
    console.log(field.matchRegex)
    regexps.set(field.id, regexpFromPattern(field.matchRegex))
    perFieldStats[index] = {
      regex: field.matchRegex,
      correct: { count: 0 },
      incorrect: { count: 0 },
    }
    perFieldIndex.set(field.id, index)
  })

  question.studentAnswer.forEach((sa) => {
    if (sa.status === StudentAnswerStatus.MISSING) {
      return
    }

    sa.exactMatch.fields.forEach((field) => {
      if (field.value === '') {
        return
      }

      const index = perFieldIndex.get(field.fieldId)
      const regex = regexps.get(field.fieldId)
      if (!regex) {
        console.error(`No regex found for field ${field.fieldId} during stat computation`)
        return
      }
      if (regex.test(field.value)) {
        perFieldStats[index].correct.count += 1
      } else {
        perFieldStats[index].incorrect.count += 1
      }
    })
  })

  return perFieldStats
}