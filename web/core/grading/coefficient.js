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

/**
 * Compute the coefficient to apply to the points obtained to get the final grade.
 * If both are zero, return 1.
 * If only gradingPoints is zero, return 0.
 * Otherwise, return points / gradingPoints.
 *
 * @param {number} gradingPoints - The maximum points for the question
 * @param {number} points - The points obtained by the student
 * @returns {number} - The coefficient to apply to the points obtained
 */
export function computeCoefficient(gradingPoints, points) {
  return gradingPoints === 0 ? (points === 0 ? 1 : 0) : points / gradingPoints
}
