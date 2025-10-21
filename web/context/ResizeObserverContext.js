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
import React, { createContext, useContext, useEffect, useRef } from 'react'

const ResizeObserverContext = createContext({})
export const ResizeObserverProvider = ({ children }) => {
  const container = useRef()
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })

  const resizeObserver = useRef(
    new ResizeObserver((entries) => {
      const { height, width } = entries[0].contentRect
      setDimensions({ height, width })
    }),
  )

  useEffect(() => {
    const element = container.current
    const observer = resizeObserver.current
    observer.observe(element)
    // Remove event listener on cleanup
    return () => observer.unobserve(element)
  }, [resizeObserver, container])

  return (
    <div
      ref={container}
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* make sure that the ResizeObserver can change sizes in all directions -> children should always overflow for height and width to decrease */}
      <div
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      >
        <ResizeObserverContext.Provider
          value={{ height: dimensions.height, width: dimensions.width }}
        >
          {children}
        </ResizeObserverContext.Provider>
      </div>
    </div>
  )
}

export const useResizeObserver = () => useContext(ResizeObserverContext)
