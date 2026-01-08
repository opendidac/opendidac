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

import { getObtainedPoints } from '@/components/evaluations/analytics/stats'
import { Button } from '@mui/material'
import Image from 'next/image'
import { useCallback } from 'react'

const COLUMN_SEPARATOR = ','
const LINE_SEPARATOR = '\r'

const ExportCSV = ({ evaluation, results, attendance }) => {
  const exportAsCSV = useCallback(() => {
    const participants = attendance?.registered?.map((r) => r.user) ?? []

    let csv = `Name${COLUMN_SEPARATOR}Email${COLUMN_SEPARATOR}Success Rate${COLUMN_SEPARATOR}Total Points${COLUMN_SEPARATOR}Obtained Points${COLUMN_SEPARATOR}`
    results.forEach((jstq) => (csv += `Q${jstq.order + 1}${COLUMN_SEPARATOR}`))
    csv += LINE_SEPARATOR

    participants.forEach((participant) => {
      let obtainedPoints = getObtainedPoints(results, participant)

      let totalPoints = results.reduce((acc, jstq) => acc + jstq.points, 0)
      let participantSuccessRate =
        totalPoints > 0 ? Math.round((obtainedPoints / totalPoints) * 100) : 0

      csv += `${participant.name}${COLUMN_SEPARATOR}${
        participant.email
      }${COLUMN_SEPARATOR}${`${participantSuccessRate} %`}${COLUMN_SEPARATOR}${totalPoints}${COLUMN_SEPARATOR}${obtainedPoints}${COLUMN_SEPARATOR}`

      results.forEach((jstq) => {
        const studentAnswer = jstq.question.studentAnswer.find(
          (sa) => sa.user.email === participant.email,
        )

        let pointsObtained = '-'
        if (studentAnswer?.studentGrading) {
          pointsObtained = studentAnswer.studentGrading.pointsObtained
        }

        csv += `"${pointsObtained}"${COLUMN_SEPARATOR}`
      })

      csv += LINE_SEPARATOR
    })

    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    let url = URL.createObjectURL(blob)
    let link = document.createElement('a')

    link.setAttribute('href', url)

    let sessionLabel = evaluation.label.replace(/ /g, '_').toLowerCase()

    link.setAttribute(
      'download',
      `evaluation-${evaluation.id}-${sessionLabel}-results.csv`,
    )
    link.click()
  }, [evaluation, results, attendance])

  return (
    <Button
      color={'info'}
      onClick={exportAsCSV}
      startIcon={
        <Image
          alt="Export"
          src="/svg/icons/file-csv.svg"
          width="22"
          height="22"
        />
      }
    >
      Export as CSV
    </Button>
  )
}

export default ExportCSV
