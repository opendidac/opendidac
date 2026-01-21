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

import { PrismaClient } from '@prisma/client'

/**
 * Generates a random 6-character alphanumeric PIN
 * Uses uppercase letters and digits (0-9, A-Z)
 * Excludes confusing characters: 0, O, I, 1
 */
const generateRandomPin = (): string => {
  // Character set: 2-9, A-Z excluding O and I
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let pin = ''

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    pin += charset[randomIndex]
  }

  return pin
}

/**
 * Generates a unique PIN for an evaluation
 * Manually checks for uniqueness and retries up to maxAttempts times if a collision occurs
 *
 * @param prisma - Prisma client instance (can be a transaction client)
 * @param maxAttempts - Maximum number of attempts to generate a unique PIN
 * @returns A unique 6-character PIN
 * @throws Error if unable to generate a unique PIN after maxAttempts
 */
export async function generateUniqueEvaluationPin(
  prisma: PrismaClient | any,
  maxAttempts: number = 100,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pin = generateRandomPin()

    // Manually check if PIN already exists (no database unique constraint)
    const existing = await prisma.evaluation.findFirst({
      where: { pin },
      select: { id: true },
    })

    if (!existing) {
      return pin
    }
  }

  throw new Error(
    `Failed to generate a unique PIN after ${maxAttempts} attempts. ` +
      'This is very unlikely and may indicate a system issue.',
  )
}

/**
 * Regenerates a PIN for an existing evaluation
 * Useful if a professor wants to change the PIN
 *
 * @param prisma - Prisma client instance
 * @param evaluationId - ID of the evaluation to update
 * @returns The new PIN
 */
export async function regenerateEvaluationPin(
  prisma: PrismaClient | any,
  evaluationId: string,
): Promise<string> {
  const newPin = await generateUniqueEvaluationPin(prisma)

  await prisma.evaluation.update({
    where: { id: evaluationId },
    data: { pin: newPin },
  })

  return newPin
}
