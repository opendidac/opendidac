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

export type {
  IApiContext,
  IApiContextWithRoles,
  IApiContextWithEvaluation,
  IEvaluationInContext,
  ISessionUser,
} from './context'

export { SessionUser } from './context'

// Type aliases for backward compatibility (deprecated, use I-prefixed versions)
import type {
  IApiContext,
  IApiContextWithRoles,
  IApiContextWithEvaluation,
  IEvaluationInContext,
} from './context'

export type ApiContext = IApiContext
export type ApiContextWithRoles = IApiContextWithRoles
export type ApiContextWithEvaluation = IApiContextWithEvaluation
export type EvaluationInContext = IEvaluationInContext
// Note: SessionUser is exported as a class, not a type alias

type ApiResponse<T> = T | ApiMessage

type ApiMessage = {
  code: string
  message: string
}

export type { ApiResponse, ApiMessage }