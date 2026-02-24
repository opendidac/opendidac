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

import { PrismaClient, Prisma } from '@prisma/client'

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
 * Generates a random PIN (does not check uniqueness)
 * Uniqueness is enforced by database constraint and retries in calling code
 *
 * @returns A random 6-character PIN
 */
export function generateRandomEvaluationPin(): string {
  return generateRandomPin()
}

/**
 * Assigns a unique PIN to an evaluation by UPDATE
 * Retries on unique constraint violations until successful
 * This ensures race-safety: create evaluation first, then assign PIN
 *
 * @param prisma - Prisma client instance
 * @param evaluationId - ID of the evaluation to assign PIN to
 * @param maxAttempts - Maximum number of attempts to assign a unique PIN
 * @returns The assigned PIN
 * @throws Error if unable to assign a unique PIN after maxAttempts
 */
export async function assignPinToEvaluation(
  prisma: PrismaClient | any,
  evaluationId: string,
  maxAttempts: number = 100,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pin = generateRandomPin()

    try {
      // Attempt to update the evaluation with the new PIN
      // Database unique constraint will catch any race conditions
      await prisma.evaluation.update({
        where: { id: evaluationId },
        data: { pin },
      })

      return pin
    } catch (error) {
      // Handle unique constraint violation (P2002) - another concurrent operation
      // may have assigned the same PIN
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target
        const isPinViolation = Array.isArray(target) && target.includes('pin')
        if (isPinViolation) {
          // Unique constraint violation on pin - retry with a new PIN
          // This ensures race-safety: if two concurrent operations pick the same PIN,
          // one will succeed and the other will retry with a different PIN
          continue
        }
      }
      // Re-throw non-PIN-related errors
      throw error
    }
  }

  throw new Error(
    `Failed to assign a unique PIN after ${maxAttempts} attempts. ` +
      'This is very unlikely and may indicate a system issue.',
  )
}

/**
 * Regenerates a PIN for an existing evaluation
 * Useful if a professor wants to change the PIN
 * Uses the same race-safe approach as assignPinToEvaluation
 *
 * @param prisma - Prisma client instance
 * @param evaluationId - ID of the evaluation to update
 * @param maxAttempts - Maximum number of attempts to assign a unique PIN
 * @returns The new PIN
 * @throws Error if unable to assign a unique PIN after maxAttempts
 */
export async function regenerateEvaluationPin(
  prisma: PrismaClient | any,
  evaluationId: string,
  maxAttempts: number = 100,
): Promise<string> {
  return assignPinToEvaluation(prisma, evaluationId, maxAttempts)
}
