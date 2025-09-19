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
import { useState, useEffect } from 'react'
import { Box, Typography, Grid, Alert, Stack } from '@mui/material'
import useSWR from 'swr'
import { fetcher } from '@/code/utils'
import DialogFeedback from '@/components/feedback/DialogFeedback'
import Loading from '@/components/feedback/Loading'
import {
  AcademicYearSelector,
  StatCard,
  QuestionTypeDisplay,
  StudentAnswersDisplay,
  ExcludedGroupsDisplay,
  ProfessorsDialogContent,
  StudentsDialogContent,
  EvaluationsDialogContent,
} from './statistics/'

// Main statistics component
const Statistics = () => {
  const [selectedYear, setSelectedYear] = useState('')
  const [availableYears, setAvailableYears] = useState([])
  const [statsData, setStatsData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [professorsDialogOpen, setProfessorsDialogOpen] = useState(false)
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false)
  const [evaluationsDialogOpen, setEvaluationsDialogOpen] = useState(false)
  const [questionsDialogOpen, setQuestionsDialogOpen] = useState(false)
  const [studentAnswersDialogOpen, setStudentAnswersDialogOpen] =
    useState(false)

  // Handler functions
  const handleViewProfessors = () => {
    setProfessorsDialogOpen(true)
  }

  const handleCloseProfessorsDialog = () => {
    setProfessorsDialogOpen(false)
  }

  const handleViewStudents = () => {
    setStudentsDialogOpen(true)
  }

  const handleCloseStudentsDialog = () => {
    setStudentsDialogOpen(false)
  }

  const handleViewEvaluations = () => {
    setEvaluationsDialogOpen(true)
  }

  const handleCloseEvaluationsDialog = () => {
    setEvaluationsDialogOpen(false)
  }

  const handleViewQuestions = () => {
    setQuestionsDialogOpen(true)
  }

  const handleCloseQuestionsDialog = () => {
    setQuestionsDialogOpen(false)
  }

  const handleViewStudentAnswers = () => {
    setStudentAnswersDialogOpen(true)
  }

  const handleCloseStudentAnswersDialog = () => {
    setStudentAnswersDialogOpen(false)
  }

  // Fetch available academic years
  const { data: yearsData, error: yearsError } = useSWR(
    '/api/admin/statistics/years',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  // Set available years and default selection
  useEffect(() => {
    if (yearsData?.years) {
      setAvailableYears(yearsData.years)
      if (!selectedYear && yearsData.years.length > 0) {
        setSelectedYear(yearsData.years[0].value)
      }
    }
  }, [yearsData, selectedYear])

  // Fetch statistics when year changes
  useEffect(() => {
    if (selectedYear) {
      setIsLoading(true)
      setError(null)
      fetch(`/api/admin/statistics/${selectedYear}`)
        .then((res) => res.json())
        .then((data) => {
          setStatsData(data)
          setIsLoading(false)
        })
        .catch((err) => {
          setError(err.message)
          setIsLoading(false)
        })
    }
  }, [selectedYear])

  if (yearsError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Failed to load available academic years: {yearsError.message}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={3}>
        {/* Header and Year Selector */}
        <Box>
          <Typography variant="h4" gutterBottom>
            Usage Statistics
            {selectedYear && (
              <Typography
                component="span"
                variant="h6"
                color="textSecondary"
                sx={{ ml: 2 }}
              >
                ({selectedYear.replace('_', '-')})
              </Typography>
            )}
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            View aggregated usage statistics by academic year (September 1st to
            September 1st next year). This includes regular evaluations and
            remediations. Test groups are automatically excluded from the
            statistics.
          </Typography>
          <Box sx={{ maxWidth: 300 }}>
            <AcademicYearSelector
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              availableYears={availableYears}
            />
          </Box>
        </Box>

        {/* Loading State */}
        <Loading loading={isLoading} error={error} />

        {/* Statistics Display */}
        {statsData && !isLoading && (
          <>
            {/* Main Statistics Cards */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Active Professors"
                  value={statsData.professors_active}
                  color="primary"
                  helpContent={
                    <>
                      <Typography variant="body2" paragraph>
                        Counts users with PROFESSOR role who signed at least one
                        grading (StudentQuestionGrading) during the academic
                        year. This indicates actual engagement with student work
                        rather than just content creation.
                      </Typography>
                    </>
                  }
                  showViewButton={statsData.professors_active > 0}
                  onView={handleViewProfessors}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Active Students"
                  value={statsData.students_active}
                  color="secondary"
                  helpContent={
                    <>
                      <Typography variant="body2" paragraph>
                        Counts users with ONLY the STUDENT role (pure students)
                        who registered to at least one evaluation during the
                        academic year. Users with multiple roles (e.g., STUDENT
                        + PROFESSOR) are excluded.
                      </Typography>
                    </>
                  }
                  showViewButton={statsData.students_active > 0}
                  onView={handleViewStudents}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Evaluations"
                  value={statsData.evaluations_total}
                  subtitle={`${statsData.evaluations_real} real evaluations`}
                  color="info"
                  helpContent={
                    <>
                      <Typography variant="body2" paragraph>
                        <strong>Total Evaluations:</strong> All evaluations
                        created during the academic year (excluding test
                        groups).
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Real Evaluations:</strong> Evaluations that
                        reached IN_PROGRESS phase or later AND have external
                        participants (user that are not part of the
                        evaluation&apos;s group members).
                      </Typography>
                      <Typography variant="body2" paragraph>
                        This excludes internal-only evaluations and evaluations
                        that are created but have not progressed.
                      </Typography>
                    </>
                  }
                  showViewButton={statsData.evaluations_total > 0}
                  onView={handleViewEvaluations}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Questions"
                  value={statsData.questions_total}
                  color="success"
                  helpContent={
                    <>
                      <Typography variant="body2" paragraph>
                        Counts questions effectively created by users during the
                        academic year, excluding test groups and copied
                        questions.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        When evaluations move from composition to registration,
                        questions are copied to freeze them. Only original
                        questions (source: BANK) are counted, not the copied
                        ones (source: EVAL or COPY).
                      </Typography>
                    </>
                  }
                  showViewButton={statsData.questions_total > 0}
                  onView={handleViewQuestions}
                />
              </Grid>
            </Grid>

            {/* Additional Statistics */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Student Answers"
                  value={statsData.student_answers_submitted}
                  color="warning"
                  helpContent={
                    <>
                      <Typography variant="body2" paragraph>
                        Counts all student answers submitted during the academic
                        year. This includes answers from all question types and
                        represents the total student engagement with the
                        platform&apos;s evaluation system.
                      </Typography>
                    </>
                  }
                  showViewButton={statsData.student_answers_submitted > 0}
                  onView={handleViewStudentAnswers}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Active Groups"
                  value={statsData.groups_active}
                  color="secondary"
                  helpContent={
                    <>
                      <Typography variant="body2" paragraph>
                        Counts all groups created during the academic year,
                        excluding test groups. Test groups are identified by
                        exact scope matches and are automatically filtered out
                        to provide accurate usage statistics.
                      </Typography>
                    </>
                  }
                />
              </Grid>
            </Grid>

            {/* Excluded Groups */}
            {statsData.test_groups_excluded &&
              statsData.test_groups_excluded.length > 0 && (
                <ExcludedGroupsDisplay
                  groups={statsData.test_groups_excluded}
                />
              )}
          </>
        )}

        {/* No Data State */}
        {!isLoading && !statsData && selectedYear && (
          <Alert severity="info">
            No data available for the selected academic year:{' '}
            {selectedYear.replace('_', '-')}
          </Alert>
        )}

        {/* Professors Dialog */}
        <DialogFeedback
          open={professorsDialogOpen}
          title={`Active Professors - ${selectedYear ? selectedYear.replace('_', '-') : ''}`}
          content={
            <ProfessorsDialogContent
              professors={statsData?.professors_details}
            />
          }
          width="lg"
          hideCancel={true}
          onClose={handleCloseProfessorsDialog}
        />

        {/* Students Dialog */}
        <DialogFeedback
          open={studentsDialogOpen}
          title={`Active Students - ${selectedYear ? selectedYear.replace('_', '-') : ''}`}
          content={
            <StudentsDialogContent students={statsData?.students_details} />
          }
          width="lg"
          hideCancel={true}
          onClose={handleCloseStudentsDialog}
        />

        {/* Evaluations Dialog */}
        <DialogFeedback
          open={evaluationsDialogOpen}
          title={`Total Evaluations - ${selectedYear ? selectedYear.replace('_', '-') : ''}`}
          content={
            <EvaluationsDialogContent
              evaluations={statsData?.evaluations_details}
            />
          }
          width="lg"
          hideCancel={true}
          onClose={handleCloseEvaluationsDialog}
        />

        {/* Questions Dialog */}
        <DialogFeedback
          open={questionsDialogOpen}
          title={`Questions by Type - ${selectedYear ? selectedYear.replace('_', '-') : ''}`}
          content={<QuestionTypeDisplay data={statsData?.questions_by_type} />}
          width="lg"
          hideCancel={true}
          onClose={handleCloseQuestionsDialog}
        />

        {/* Student Answers Dialog */}
        <DialogFeedback
          open={studentAnswersDialogOpen}
          title={`Student Answers by Type - ${selectedYear ? selectedYear.replace('_', '-') : ''}`}
          content={
            <StudentAnswersDisplay data={statsData?.student_answers_by_type} />
          }
          width="lg"
          hideCancel={true}
          onClose={handleCloseStudentAnswersDialog}
        />
      </Stack>
    </Box>
  )
}

export default Statistics
