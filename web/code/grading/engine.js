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
  StudentQuestionGradingStatus,
  QuestionType,
  DatabaseQueryOutputStatus,
  CodeQuestionType,
} from '@prisma/client'
import GradingPolicy from './policy'
import { regexpFromPattern } from '@/code/utils'

/*
    This function is used to grade a users answers to a question.
    argument "answers" is the users answers to the question.
    argument "question" is the question to which the users answers is submitted.

    If called with answers = undefined, the function will return the default grading.
    Default grading is generally (pointsObtained = 0, status = AUTOGRADED),

    Grading differs for code questions (pointsObtained = 0, status = UNGRADED) because the grading cannot be determined
    during answers editing (code file editing), the grading of code question is done during the code-check run (see /api/sandbox/[questionId]/users.js).

 */

export const grading = (question, totalPoints, studentAnswer) => {
  switch (question.type) {
    case QuestionType.multipleChoice:
      return gradeMultipleChoice(question, totalPoints, studentAnswer)
    case QuestionType.trueFalse:
      return gradeTrueFalse(question, totalPoints, studentAnswer)
    case QuestionType.essay:
      return gradeEssay(studentAnswer)
    case QuestionType.code:
      return gradeCode(question, totalPoints, studentAnswer)
    case QuestionType.web:
      return gradeWeb(studentAnswer)
    case QuestionType.database:
      // users database submission is graded during users database sandbox run
      return gradeDatabase(totalPoints, studentAnswer)
    case QuestionType.exactMatch:
      return gradeExactMatch(question, totalPoints, studentAnswer)
    default:
      return undefined
  }
}

/*
  evaluationToQuestion.points,
  evaluationToQuestion.question - for official solution
 */

const defaultGrading = {
  status: StudentQuestionGradingStatus.AUTOGRADED,
  pointsObtained: 0,
}

const gradeDatabase = (totalPoints, studentAnswer) => {
  let grading = defaultGrading

  if (studentAnswer) {
    const studentQueries = studentAnswer.database.queries
    const studentTestQueries = studentQueries.filter(
      (studentQuery) => studentQuery.query.testQuery,
    )
    const allQueriesExecuted = studentQueries.every(
      (studentQuery) =>
        studentQuery.studentOutput !== null &&
        studentQuery.studentOutput.status === DatabaseQueryOutputStatus.SUCCESS,
    )
    const allTestQueriesPassed = studentTestQueries.every(
      (studentQuery) =>
        studentQuery.studentOutput !== null &&
        studentQuery.studentOutput.status ===
          DatabaseQueryOutputStatus.SUCCESS &&
        studentQuery.studentOutput.output.testPassed,
    )
    if (allQueriesExecuted && allTestQueriesPassed) {
      grading = {
        status: StudentQuestionGradingStatus.AUTOGRADED,
        pointsObtained: totalPoints,
      }
    }
  }

  return grading
}

// Main grading function for multiple choice
const gradeMultipleChoice = (question, totalPoints, studentAnswer) => {
  if (studentAnswer === undefined) {
    // When student joins the evaluation, the answer is undefined
    return defaultGrading
  }

  const policy = GradingPolicy.getPolicy(
    QuestionType.multipleChoice,
    question.multipleChoice.gradingPolicy,
  )
  const { finalScore } = policy.calculate({
    solution: question.multipleChoice,
    answer: studentAnswer,
    totalPoints: totalPoints,
  })

  return {
    status: StudentQuestionGradingStatus.AUTOGRADED,
    pointsObtained: finalScore,
  }
}

const gradeTrueFalse = (question, totalPoints, studentAnswer) => {
  let grading = defaultGrading
  if (studentAnswer !== undefined) {
    let isCorrect = question.trueFalse.isTrue === studentAnswer.isTrue
    grading = {
      ...grading,
      pointsObtained: isCorrect ? totalPoints : 0,
    }
  }
  return grading
}

/*
    code grading call is done during answers submission and code test run
    code test run : /api/sandbox/[questionId]/users
*/
const gradeCode = (question, totalPoints, studentAnswer) => {
  let grading = {
    ...defaultGrading,
    status: StudentQuestionGradingStatus.UNGRADED,
  }

  const codeType = question.code.codeType

  const gradeCodeWriting = (studentAnswer) => {
    const success = studentAnswer?.allTestCasesPassed
    if (success !== undefined) {
      // response is from the code sandbox run
      grading = {
        ...grading,
        status: StudentQuestionGradingStatus.AUTOGRADED,
        pointsObtained: success ? totalPoints : 0,
      }
    }
    return grading
  }

  const gradeCodeReading = (studentAnswer) => {
    const success = studentAnswer?.outputs?.every(
      (output) => output.output === output.codeReadingSnippet.output,
    )
    grading = {
      ...grading,
      status: StudentQuestionGradingStatus.AUTOGRADED,
      pointsObtained: success ? totalPoints : 0,
    }
    return grading
  }

  switch (codeType) {
    case CodeQuestionType.codeWriting:
      return gradeCodeWriting(studentAnswer)
    case CodeQuestionType.codeReading:
      return gradeCodeReading(studentAnswer)
    default:
      return grading
  }
}

const gradeEssay = (answer) => ({
  ...defaultGrading,
  status: answer
    ? StudentQuestionGradingStatus.UNGRADED
    : StudentQuestionGradingStatus.AUTOGRADED,
})

const gradeWeb = (answer) => ({
  ...defaultGrading,
  status: answer
    ? StudentQuestionGradingStatus.UNGRADED
    : StudentQuestionGradingStatus.AUTOGRADED,
})

const gradeExactMatch = (question, totalPoints, studentAnswer) => {
  const correctFields = studentAnswer?.fields?.reduce((acc, field, index) => {
    const fieldRegex = question.exactMatch.fields[index].matchRegex
    let regex = regexpFromPattern(fieldRegex)
    return acc + (regex.test(field.value) ? 1 : 0)
  }, 0)

  const fieldCount = question.exactMatch.fields.length

  return {
    status: StudentQuestionGradingStatus.AUTOGRADED,
    pointsObtained: correctFields / fieldCount * totalPoints,
  }
}
