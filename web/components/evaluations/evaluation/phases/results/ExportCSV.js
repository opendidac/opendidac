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

// Semicolon-separated, CRLF-terminated, all cells quoted: opens correctly
// on double-click in European-locale Excel (which expects ';' as the list
// separator) without coercing dot-decimal points like 1.33 into 133.
const COLUMN_SEPARATOR = ';'
const LINE_SEPARATOR = '\r\n'

// Quote every cell and escape embedded quotes (RFC 4180).
const cell = (value) => `"${String(value).replace(/"/g, '""')}"`

// Numeric cells use a comma decimal separator: with a dot, French-locale
// Excel reads 22.5 as the date "22 mai" and 1.33 as garbage.
const numberCell = (value) =>
  cell(typeof value === 'number' ? String(value).replace('.', ',') : value)

const ExportCSV = ({ evaluation, results, attendance }) => {
  const exportAsCSV = useCallback(() => {
    const participants = attendance?.registered?.map((r) => r.user) ?? []

    const header = [
      'Name',
      'Email',
      'Success Rate',
      'Total Points',
      'Obtained Points',
      ...results.map((jstq) => `Q${jstq.order + 1}`),
    ]

    const lines = [header.map(cell).join(COLUMN_SEPARATOR)]

    participants.forEach((participant) => {
      const obtainedPoints = getObtainedPoints(results, participant)

      const totalPoints = results.reduce((acc, jstq) => acc + jstq.points, 0)
      const participantSuccessRate =
        totalPoints > 0 ? Math.round((obtainedPoints / totalPoints) * 100) : 0

      const row = [
        cell(participant.name),
        cell(participant.email),
        cell(`${participantSuccessRate} %`),
        numberCell(totalPoints),
        numberCell(obtainedPoints),
        ...results.map((jstq) => {
          const studentAnswer = jstq.question.studentAnswer.find(
            (sa) => sa.user.email === participant.email,
          )
          return numberCell(
            studentAnswer?.studentGrading
              ? studentAnswer.studentGrading.pointsObtained
              : '-',
          )
        }),
      ]

      lines.push(row.join(COLUMN_SEPARATOR))
    })

    // BOM: without it Excel decodes the file as ANSI and breaks accents.
    const csv = '\uFEFF' + lines.join(LINE_SEPARATOR) + LINE_SEPARATOR

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
