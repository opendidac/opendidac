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

import type { StudentAnswerPayload } from './types'

/**
 * Safely extract the student answer from an array of StudentAnswer objects.
 * Ensures correct typing and handles missing/null arrays.
 */
export function extractStudentAnswer(
  answers: unknown,
  email: string,
): StudentAnswerPayload | null {
  if (!Array.isArray(answers)) return null

  const match = answers.find((sa: any) => sa?.user?.email === email)

  return match ? (match as StudentAnswerPayload) : null
}
