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

const handler = async (req, res, prisma) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get min and max dates from StudentAnswer to determine the actual data range
    const dateRange = await prisma.studentAnswer.aggregate({
      _min: {
        createdAt: true,
      },
      _max: {
        createdAt: true,
      },
    })

    const minDate = dateRange._min.createdAt
    const maxDate = dateRange._max.createdAt

    const years = []

    if (minDate && maxDate) {
      // Convert dates to academic years
      const minYear = minDate.getFullYear()
      const maxYear = maxDate.getFullYear()

      // Generate academic years from min year to max year (based on actual data)
      for (let year = minYear; year <= maxYear; year++) {
        const nextYear = year + 1
        const label = `${year}-${nextYear}`
        const value = `${year}_${nextYear}`
        years.push({ label, value })
      }

      // Sort in descending order (most recent first)
      years.reverse()
    } else {
      // Fallback: if no data, generate last 5 years to current year
      const currentYear = new Date().getFullYear()
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i
        const nextYear = year + 1
        const label = `${year}-${nextYear}`
        const value = `${year}_${nextYear}`
        years.push({ label, value })
      }
    }

    res.status(200).json({ years })
  } catch (error) {
    console.error('Error fetching academic years:', error)
    res.status(500).json({ error: 'Failed to fetch academic years' })
  }
}

export default withMethodHandler({
  GET: withAuthorization(withPrisma(handler), [Role.SUPER_ADMIN]),
})
