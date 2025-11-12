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

import languages from '@/code/languages.json'

export const fetcher = async (url) => {
  const res = await fetch(url)

  // Read and parse the response body once.
  const data = await res.json()

  if (!res.ok) {
    const error = {
      status: res.status,
      ...data,
    }

    if (!error.type) {
      error.type = 'error'
    }

    if (!error.message) {
      error.message = 'An error occurred'
    }

    throw {
      status: res.status,
      ...data,
    }
  }

  // Return the parsed data.
  return data
}

const fetchWithTimeout = (fetcher, url, options = {}, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Request timed out'))
    }, timeout)

    fetcher(url, options)
      .then((response) => {
        clearTimeout(timer)
        resolve(response)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

export const fetcherWithTimeout = (timeout) => {
  return async (url) => {
    try {
      const res = await fetchWithTimeout(
        fetcher,
        url,
        { method: 'GET' },
        timeout,
      ) // Use custom timeout

      // Return the parsed data.
      return res
    } catch (error) {
      if (error.message === 'Request timed out') {
        throw {
          status: 408,
          type: 'error',
          message: 'Request timed out',
        }
      }
      throw error
    }
  }
}

/*
this link send to users to the PageDispatch which decides (using api evaluation/id/dispatch endpoint) where the users should be directed
* */
export const getStudentEntryLink = (
  evaluationId,
  desktopAppRequired = false,
) => {
  if (desktopAppRequired) {
    return `opendidac://users/evaluations/${evaluationId}`
  }
  return `${window && window.location.origin}/users/evaluations/${evaluationId}`
}

export const languageBasedOnPathExtension = (path) => {
  if (!path) return null
  const extension = path.split('.').pop()
  return languages.monacoExtensionToLanguage[extension]
}

/**
 * Returns a RegExp object constructed from the given pattern, which may or may not contain flags. If it does not, the
 * default flags are used
 */
export const regexpFromPattern = (pattern) => {
  const parts = pattern.match(/^\/(.*)\/([a-z]*)$/)
  return !parts || parts.length !== 3
    ? new RegExp(pattern)
    : new RegExp(parts[1], parts[2])
}
