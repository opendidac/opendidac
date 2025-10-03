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
  withAuthorization,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'
import { Role } from '@prisma/client'

// Test group scopes to exclude (exact matches)
const EXCLUDED_GROUP_SCOPES = ['demo', 'test']

const handler = async (req, res, prisma) => {
  try {
    const { academicYear } = req.query

    if (!academicYear) {
      return res.status(400).json({ error: 'Academic year is required' })
    }

    // Validate academic year format (e.g., "2025_2026")
    const yearPattern = /^\d{4}_\d{4}$/
    if (!yearPattern.test(academicYear)) {
      return res.status(400).json({
        error: 'Invalid academic year format. Expected format: YYYY_YYYY',
      })
    }

    // Extract start and end years from format "2025_2026"
    const [startYearStr, endYearStr] = academicYear.split('_')
    const startYear = parseInt(startYearStr)
    const endYear = parseInt(endYearStr)

    // Validate that endYear is startYear + 1
    if (endYear !== startYear + 1) {
      return res.status(400).json({
        error: 'Invalid academic year. End year must be start year + 1',
      })
    }

    const startDate = new Date(startYear, 8, 1) // September 1st
    const endDate = new Date(endYear, 8, 1) // September 1st of next year

    // Get excluded test groups by scope
    const excludedGroups = await prisma.group.findMany({
      where: {
        scope: {
          in: EXCLUDED_GROUP_SCOPES,
        },
      },
      select: {
        id: true,
        label: true,
        scope: true,
      },
    })

    const testGroupsExcluded = excludedGroups.map((group) => group.label)
    const excludedGroupIds = excludedGroups
      .map((group) => group.id)
      .filter((id) => id !== undefined)

    // Common where clauses for reuse
    const dateRangeFilter = {
      gte: startDate,
      lt: endDate,
    }

    const excludeTestGroupsFilter =
      excludedGroupIds.length > 0
        ? {
            notIn: excludedGroupIds,
          }
        : undefined

    const commonEvaluationWhere = {
      createdAt: dateRangeFilter,
      ...(excludeTestGroupsFilter && { groupId: excludeTestGroupsFilter }),
    }

    const commonQuestionWhere = {
      createdAt: dateRangeFilter,
      ...(excludeTestGroupsFilter && { groupId: excludeTestGroupsFilter }),
    }

    const commonStudentAnswerWhere = {
      status: 'SUBMITTED',
      createdAt: dateRangeFilter,
      ...(excludeTestGroupsFilter && {
        question: {
          groupId: excludeTestGroupsFilter,
        },
      }),
    }

    const commonGroupWhere = {
      createdAt: dateRangeFilter,
      ...(excludeTestGroupsFilter && { id: excludeTestGroupsFilter }),
    }

    // 1. Active professors (users with PROFESSOR role who signed gradings in this academic year)
    // Only consider gradings linked to questions from non-excluded groups
    const professors = await prisma.user.findMany({
      where: {
        roles: {
          has: Role.PROFESSOR,
        },
        gradingSignedBy: {
          some: {
            createdAt: dateRangeFilter,
            studentAnswer: excludeTestGroupsFilter
              ? {
                  question: {
                    groupId: excludeTestGroupsFilter,
                  },
                }
              : undefined,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        gradingSignedBy: {
          where: {
            createdAt: dateRangeFilter,
            ...(excludeTestGroupsFilter && {
              studentAnswer: {
                question: {
                  groupId: excludeTestGroupsFilter,
                },
              },
            }),
          },
          select: {
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    // Process professors data for detailed display
    const professorsDetails = professors
      .map((professor) => {
        const gradings = professor.gradingSignedBy
        return {
          id: professor.id,
          name: professor.name,
          email: professor.email,
          gradingCount: gradings.length,
          firstGrading: gradings.length > 0 ? gradings[0].createdAt : null,
          lastGrading:
            gradings.length > 0
              ? gradings[gradings.length - 1].createdAt
              : null,
        }
      })
      .sort((a, b) => b.gradingCount - a.gradingCount) // Sort by grading count (most active first)

    // Keep only professors with at least one grading after exclusions
    const filteredProfessorsDetails = professorsDetails.filter(
      (p) => p.gradingCount > 0,
    )

    // 2. Active students (users with ONLY STUDENT role who registered to evaluations in this academic year)
    const students = await prisma.user.findMany({
      where: {
        roles: {
          equals: ['STUDENT'],
        },
        userOnEvaluation: {
          some: {
            registeredAt: dateRangeFilter,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        userOnEvaluation: {
          where: {
            registeredAt: dateRangeFilter,
          },
          select: {
            registeredAt: true,
            evaluation: {
              select: {
                id: true,
                label: true,
              },
            },
          },
          orderBy: {
            registeredAt: 'asc',
          },
        },
      },
    })

    // Process students data for detailed display
    const studentsDetails = students
      .map((student) => {
        const registrations = student.userOnEvaluation
        const registrationDates = registrations.map((ue) => ue.registeredAt)

        // Get evaluation IDs that this student registered for
        const registeredEvaluationIds = new Set(
          registrations.map((ue) => ue.evaluation.id),
        )

        return {
          id: student.id,
          name: student.name,
          email: student.email,
          evaluationCount: registrations.length,
          firstParticipation:
            registrationDates.length > 0 ? registrationDates[0] : null,
          lastParticipation:
            registrationDates.length > 0
              ? registrationDates[registrationDates.length - 1]
              : null,
        }
      })
      .sort((a, b) => b.evaluationCount - a.evaluationCount) // Sort by evaluation count (most active first)

    // 3. Evaluations (FINISHED only, excluding test groups). Also fetch group members to filter external participants without N+1 queries
    const evaluations = await prisma.evaluation.findMany({
      where: {
        ...commonEvaluationWhere,
        phase: 'FINISHED',
      },
      select: {
        id: true,
        label: true,
        phase: true,
        createdAt: true,
        group: {
          select: {
            label: true,
            members: {
              select: {
                user: {
                  select: { email: true },
                },
              },
            },
          },
        },
        students: {
          select: {
            userEmail: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Sort by creation date, newest first
      },
    })

    // 4. Real evaluations = FINISHED phase AND with external participants (filter in-memory, no extra DB calls)
    const realEvaluations = evaluations.filter((evaluation) => {
      const groupMemberEmails = new Set(
        (evaluation.group?.members || []).map((member) => member.user.email),
      )
      return evaluation.students.some(
        (student) => !groupMemberEmails.has(student.userEmail),
      )
    })

    // 5. Total questions (excluding test groups and copied questions)
    const questions = await prisma.question.findMany({
      where: {
        ...commonQuestionWhere,
        source: 'BANK', // Only count questions effectively created by users, not copied ones
      },
      select: {
        type: true,
      },
    })

    // 6. Questions by type
    const questionsByType = questions.reduce((acc, question) => {
      acc[question.type] = (acc[question.type] || 0) + 1
      return acc
    }, {})

    // 7. Student answers submitted
    const studentAnswers = await prisma.studentAnswer.findMany({
      where: commonStudentAnswerWhere,
      select: {
        question: {
          select: {
            type: true,
          },
        },
      },
    })

    // 8. Student answers by type
    const studentAnswersByType = studentAnswers.reduce((acc, answer) => {
      const type = answer.question.type
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    // 9. Active groups (excluding test groups)
    const groups = await prisma.group.findMany({
      where: commonGroupWhere,
      select: {
        id: true,
      },
    })

    // Format the response (only real evaluations are returned)
    const response = {
      academic_year: academicYear,
      professors_active: filteredProfessorsDetails.length,
      professors_details: filteredProfessorsDetails,
      students_active: students.length,
      students_details: studentsDetails,
      evaluations_total: realEvaluations.length,
      evaluations_details: realEvaluations,
      questions_total: questions.length,
      questions_by_type: questionsByType,
      student_answers_submitted: studentAnswers.length,
      student_answers_by_type: studentAnswersByType,
      groups_active: groups.length,
      test_groups_excluded: testGroupsExcluded,
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Error fetching statistics:', error)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
}

export default withMethodHandler({
  GET: withAuthorization(withPrisma(handler), [Role.SUPER_ADMIN]),
})
