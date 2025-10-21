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
import { GenericContainer, Wait } from 'testcontainers'

import {
  DatabaseQueryOutputStatus,
  DatabaseQueryOutputType,
} from '@prisma/client'
import pkg from 'pg'
import {
  postgresDetermineOutputType,
  postgresGenerateFeedbackMessage,
  postgresOutputToToDataset,
} from '../code/database'
import { pullImageIfNotExists } from './utils'

const { Client } = pkg

const EXECUTION_TIMEOUT = 5000

const startContainer = async (image) => {
  const container = await new GenericContainer(image)
    .withResourcesQuota({
      cpu: 0.35, // of a CPU core
      memory: 0.5, // in GB
    })
    .withExposedPorts(5432)
    .withWaitStrategy(
      Wait.forLogMessage('database system is ready to accept connections'),
    )
    .start()
  return container
}

export const runSandboxDB = async ({
  image = 'postgres:latest',
  databaseConfig = {
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  },
  queries = [], // string[]
}) => {
  const results = []
  let container
  let client
  // First try to start the container, then pull the image if it doesn't exist
  // This approach is used to avoid sending check requests to the docker daemon unnecessarily on each run
  try {
    container = await startContainer(image)
  } catch (initialError) {
    // Check if the error is related to the image not being present
    if (initialError.message.includes('No such image')) {
      const { status, message } = await pullImageIfNotExists(image)
      if (!status) {
        return [
          {
            status: DatabaseQueryOutputStatus.ERROR,
            feedback: message,
            type: DatabaseQueryOutputType.TEXT,
            result: message,
          },
        ]
      }

      // Try to start the container again
      try {
        container = await startContainer(image)
      } catch (secondError) {
        return [
          {
            status: DatabaseQueryOutputStatus.ERROR,
            feedback: `Error after pulling image: ${secondError.message}`,
            type: DatabaseQueryOutputType.TEXT,
            result: `Error after pulling image: ${secondError.message}`,
          },
        ]
      }
    } else {
      // Handle other errors when starting the container
      return [
        {
          status: DatabaseQueryOutputStatus.ERROR,
          feedback: `Container start error: ${initialError.message}`,
          type: DatabaseQueryOutputType.TEXT,
          result: `Container start error: ${initialError.message}`,
        },
      ]
    }
  }

  return new Promise(async (resolve, _) => {
    // Container is running, try to connect to it and execute the queries
    try {
      client = new Client({
        host: container.getHost(),
        port: container.getFirstMappedPort(),
        ...databaseConfig,
      })

      let timeout = setTimeout(() => {
        client.end()
        container.stop()
        results.push({
          status: DatabaseQueryOutputStatus.ERROR,
          feedback: 'Sandbox Execution Timeout',
          type: DatabaseQueryOutputType.TEXT,
          result: 'Sandbox Execution Timeout',
        })
        resolve(results)
      }, EXECUTION_TIMEOUT)

      try {
        await client.connect()

        let order = 1
        for (const query of queries) {
          const result = await client.query(query)
          const dataset = postgresOutputToToDataset(result)
          const type = postgresDetermineOutputType(result)
          const feedback = postgresGenerateFeedbackMessage(
            result.command,
            result,
          )
          results.push({
            order: order++,
            status: DatabaseQueryOutputStatus.SUCCESS,
            feedback: feedback,
            type: type,
            result: type === DatabaseQueryOutputType.TEXT ? feedback : dataset,
          })
        }
        clearTimeout(timeout) // Clear the timeout if queries finish on time
        resolve(results)
      } catch (error) {
        clearTimeout(timeout) // Clear the timeout if there's an error
        results.push({
          order: results.length + 1, // Adjusted order logic
          status: DatabaseQueryOutputStatus.ERROR,
          feedback: error.message,
          type: DatabaseQueryOutputType.TEXT,
          result: error,
        })
        resolve(results)
      }
    } catch (error) {
      // General error handling for the container setup or connection
      results.push({
        status: DatabaseQueryOutputStatus.ERROR,
        feedback: `Client connection error: ${error.message}`,
        type: DatabaseQueryOutputType.TEXT,
        result: `Client connection error: ${error.message}`,
      })
      resolve(results)
    } finally {
      if (client) await client.end()
      if (container) await container.stop()
    }
  })
}
