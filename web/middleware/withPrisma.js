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
 * Generates computed fields descriptor for Prisma models.
 */
function computedFieldsDescriptor() {
  return {
    evaluationToQuestion: {
      coefficient: {
        needs: { points: true, gradingPoints: true },
        compute(evaluationToQuestion) {
          if (evaluationToQuestion.gradingPoints === 0) {
            return 0
          }
          return evaluationToQuestion.points / evaluationToQuestion.gradingPoints
        },
      }
    }
  }
}

if (!global.xyz_prisma) {
  global.xyz_prisma = new PrismaClient().$extends({
    result: computedFieldsDescriptor(),
  })
}

export function withPrisma(handler) {
  return async (req, res) => {
    return handler(req, res, global.xyz_prisma)
  }
}

export function getPrisma() {
  return global.xyz_prisma
}
