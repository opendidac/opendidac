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
import Docker from 'dockerode'

const docker = new Docker()

export const imageExists = async (name) => {
  const images = await docker.listImages({ filters: { reference: [name] } })
  return images.length > 0
}

export const pullImage = async (name) => {
  return new Promise((resolve, reject) => {
    docker.pull(name, {}, (err, stream) => {
      if (err) return reject(err)
      docker.modem.followProgress(stream, (error, output) => {
        if (error) reject(error)
        resolve(output)
      })
    })
  })
}

export const pullImageIfNotExists = async (image) => {
  try {
    // Check if the image exists locally
    const exists = await imageExists(image)
    if (exists) {
      return {
        status: true,
        wasExisting: true,
        message: 'Image already exists',
      }
    }

    // Pull the image if it's not available locally
    await pullImage(image)
    return {
      status: true,
      wasExisting: false,
      message: 'Image pulled successfully',
    }
  } catch (error) {
    console.error('Error pulling image:', error)
    return { status: false, message: `Error pulling image: ${error.message}` }
  }
}

export const cleanUpDockerStreamHeaders = (input) => {
  if (typeof input !== 'string') return input
  /*
          The response contains some headers that we need to remove
          \x01 -> response comes from stdout
          \x02 -> response comes from stderr
          and the first 8 bytes are the length of the message
      */
  // find \x01 or \x02 and remove the next 8 bytes
  /*
          tried with regexp : input.replaceAll(/(\x01|\x02).{8}/gm, '')
          but it didnt not work
      */

  let output = ''

  for (let i = 0; i < input.length; i++) {
    if (input[i] !== '\x01' && input[i] !== '\x02') {
      output += input[i]
    } else {
      i += 7
    }
  }

  return output
}

/*
will filter out any invalid utf8 character. Used to sanitize the output of the sandboxes
*/
export const sanitizeUTF8 = (str) =>
  str.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uD7FF\uE000-\uFFFD]/g, '')
