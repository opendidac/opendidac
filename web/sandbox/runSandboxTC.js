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
import uniqid from 'uniqid'
import fs from 'fs'
import tar from 'tar'

import { GenericContainer } from 'testcontainers'
import {
  cleanUpDockerStreamHeaders,
  pullImageIfNotExists,
  sanitizeUTF8,
} from './utils'

// mode = run / test
// https://www.npmjs.com/package/testcontainers
// https://github.com/apocas/dockerode

const BEFOREALL_TIMEOUT = 10000
const EXECUTION_TIMEOUT = 3000
const MAX_OUTPUT_SIZE_PER_EXEC_KB = 32

export const runSandbox = async ({
  image = 'node:latest',
  files = [],
  beforeAll = undefined,
  tests = [],
}) => {
  const directory = await prepareContent(files)

  let container, beforeAllOutput

  try {
    // Try to start the container
    ;({ container, beforeAllOutput } = await startContainer(
      image,
      directory,
      beforeAll,
    ))
  } catch (initialError) {
    // Handle missing image
    if (initialError.message.includes('No such image')) {
      const { status, message } = await pullImageIfNotExists(image)
      if (!status) {
        return {
          beforeAll: message,
          tests: [],
        }
      }
    } else {
      return {
        beforeAll: initialError.message,
        tests: [],
      }
    }

    try {
      // Retry starting the container after pulling the image
      ;({ container, beforeAllOutput } = await startContainer(
        image,
        directory,
        beforeAll,
      ))
    } catch (secondError) {
      return {
        beforeAll: secondError.message,
        tests: [],
      }
    }
  }

  try {
    // Run tests with individual timeouts
    const testsResults = await execTests(container, tests)
    return {
      beforeAll: beforeAllOutput,
      tests: testsResults,
    }
  } catch (error) {
    return {
      beforeAll: beforeAllOutput,
      tests: [],
    }
  } finally {
    // Ensure the container is stopped after execution
    await container.stop()
  }
}

const prepareContent = (files) =>
  new Promise((resolve, _) => {
    let codeDirectory = `sandbox/runs/tc/${uniqid()}`
    fs.mkdirSync(codeDirectory, { recursive: true })

    files.map(({ path, content }) => {
      let filesDirectory = `${codeDirectory}/${path
        .split('/')
        .slice(0, -1)
        .join('/')}`
      let fileName = path.split('/').slice(-1)[0]

      fs.mkdirSync(filesDirectory, { recursive: true })

      fs.writeFileSync(`${filesDirectory}/${fileName}`, content || '')
    })

    tar
      .c({ gzip: true, cwd: codeDirectory }, ['.'])
      .pipe(fs.createWriteStream(`${codeDirectory}/code.tar.gz`))
      .on('close', () => resolve(codeDirectory))
  })

const startContainer = async (image, filesDirectory, beforeAll) => {
  let container = await new GenericContainer(image)
    .withResourcesQuota({
      cpu: 0.3, //a CPU core
      memory: 0.25,
    })
    .withWorkingDir('/')
    .withEnvironment('NODE_NO_WARNINGS', '1')
    .withCopyFilesToContainer([
      { source: `${filesDirectory}/code.tar.gz`, target: '/code.tar.gz' },
    ])
    .withCommand(['sleep', 'infinity'])
    .start()

  await container.exec(['sh', '-c', 'tar -xzf code.tar.gz -C /'], {
    tty: false,
  })

  let beforeAllOutput = undefined

  if (beforeAll) {
    const startTime = new Date().getTime() // Start time measurement

    try {
      // Create a promise for the execution of beforeAll
      const execPromise = container.exec(
        [
          'sh',
          '-c',
          `${beforeAll} 2>&1 | head -c ${MAX_OUTPUT_SIZE_PER_EXEC_KB * 1024}`,
        ],
        { tty: false },
      )

      // Create a promise for the timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new Error(`beforeAll Timeout (t > ${BEFOREALL_TIMEOUT}ms)`)),
          BEFOREALL_TIMEOUT,
        ),
      )

      // Wait for either the execution to complete or timeout
      const { output } = await Promise.race([execPromise, timeoutPromise])

      beforeAllOutput = sanitizeUTF8(cleanUpDockerStreamHeaders(output))
    } catch (error) {
      beforeAllOutput = error.message // Capture the timeout or other error
    }

    const endTime = new Date().getTime() // End time measurement
    const executionTime = endTime - startTime

    // Log the execution time for debugging purposes
    console.log(`beforeAll execution time: ${executionTime}ms`)
  }

  /* ## CONTENT DELETE */
  fs.rmSync(filesDirectory, { recursive: true, force: true })

  return {
    beforeAllOutput,
    container,
  }
}

const execTests = async (container, tests) => {
  const results = []

  for (let index = 0; index < tests.length; index++) {
    const { exec, input, expectedOutput } = tests[index]

    // Start measuring execution time
    const startTime = new Date().getTime()

    try {
      // Create a promise for the execution
      const execPromise = container.exec(
        [
          'sh',
          '-c',
          `echo "${input}" | ${exec} 2>&1 | head -c ${
            MAX_OUTPUT_SIZE_PER_EXEC_KB * 1024
          }`,
        ],
        {
          tty: false,
        },
      )

      // Create a promise for the timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new Error(`Execution Timeout (t > ${EXECUTION_TIMEOUT}ms)`)),
          EXECUTION_TIMEOUT,
        ),
      )

      // Wait for either the exec or the timeout
      const { output } = await Promise.race([execPromise, timeoutPromise])

      // Measure end time and calculate execution duration
      const endTime = new Date().getTime()
      const executionTime = endTime - startTime

      // Process output and push the result
      const sanitizedOutput = sanitizeUTF8(cleanUpDockerStreamHeaders(output))
      results.push({
        exec,
        input,
        output: sanitizedOutput,
        expectedOutput,
        executionTimeMS: executionTime,
        passed: sanitizedOutput === expectedOutput,
        timeout: false, // No timeout occurred
      })
    } catch (error) {
      // Handle timeout or other errors
      const endTime = new Date().getTime()
      const executionTime = endTime - startTime

      results.push({
        exec,
        input,
        output: error.message,
        expectedOutput,
        executionTimeMS: executionTime,
        passed: false,
        timeout: error.message === 'Execution Timeout', // Mark if it was a timeout
      })
    }
  }

  return results
}
