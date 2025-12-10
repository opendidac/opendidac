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

import type { IApiContext } from './context';

/**
 * UNIVERSAL API RESPONSE TYPES
 * -----------------------------
 * These types describe the contract for ALL API routes.
 * A handler must return either:
 *   - ApiSuccessResponse<T>
 *   - ApiErrorResponse
 *   - ApiResponse<T> (union of both)
 */

export type ApiErrorStatus =
  | 400
  | 401
  | 403
  | 404
  | 409
  | 422
  | 500;

export type ApiSuccessStatus = 200;

/**
 * Error response shape (no data).
 */
export type ApiErrorResponse = {
  status: ApiErrorStatus;
  message: string;
};

/**
 * Success response shape (has data payload).
 */
export type ApiSuccessResponse<T> = {
  status: ApiSuccessStatus;
  data: T;
};

/**
 * Union for all possible responses.
 * Handlers simply return ApiResponse<T>.
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Helper type for handlers returning typed API responses.
 *
 * Example usage:
 *   const get: ApiHandler<ProfessorListingPayload> = async (ctx) => { ... }
 */
export type ApiHandler<T> = (
  ctx: IApiContext
) => Promise<ApiResponse<T>>;
