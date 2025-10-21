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
import LoadingAnimation from './LoadingAnimation'

const Loading = ({ children, errors = [], loading = true, message = '' }) => {
  // find first error that is not undefined or null
  const error = errors.find(
    (error) => error !== undefined && error.type === 'error',
  )
  if (error)
    return <LoadingAnimation status={'error'} content={error.message} />

  // find first info that is not undefined or null
  const info = errors.find(
    (error) => error !== undefined && error.type === 'info',
  )
  if (info) return <LoadingAnimation status={'info'} content={info.message} />

  // otherwise show loading animation
  if (loading) return <LoadingAnimation content={message} />

  // if not loading and no error, return children
  return children
}

export default Loading
