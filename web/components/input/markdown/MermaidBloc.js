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
import mermaid from 'mermaid'
import { Box } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

// Initialize Mermaid's global settings
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
})

const MermaidBloc = ({ code }) => {
  const ref = useRef(null)
  const [id] = useState(uuidv4()) // Create a unique ID for each component instance

  useEffect(() => {
    // Make sure the code is not attempted to be rendered server-side
    if (typeof window !== 'undefined' && ref.current && code) {
      // Check if the container is properly initialized
      try {
        mermaid
          .render(`mermaid-${id}`, code, ref.current)
          .then(({ bindFunctions, svg }) => {
            ref.current.innerHTML = svg
            if (bindFunctions && Array.isArray(bindFunctions)) {
              bindFunctions.forEach((f) => f(ref.current))
            }
          })
          .catch((error) => {
            //ignore
          })
      } catch (error) {
        //ignore
      }
    }
  }, [code, id]) // Include id in the dependencies array

  return <Box ref={ref} style={{ width: '100%', minHeight: '100px' }} />
}

export default MermaidBloc
