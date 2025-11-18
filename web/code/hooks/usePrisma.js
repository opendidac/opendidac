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

// Global key for storing the Prisma client instance
const PRISMA_GLOBAL_KEY = 'opendidac_prisma_client'

/**
 * Backend hook to get the Prisma client instance.
 * Enforces a single Prisma session across the application.
 * 
 * @returns {PrismaClient} The singleton Prisma client instance
 */
const usePrisma = () => {
  // Ensure we have a single Prisma instance
  if (!global[PRISMA_GLOBAL_KEY]) {
    global[PRISMA_GLOBAL_KEY] = new PrismaClient()
  }
  
  return global[PRISMA_GLOBAL_KEY]
}

// Export as getPrismaClient to avoid React hook linting rules
export { usePrisma as getPrismaClient }

