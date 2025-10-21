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
import React, { useCallback, useEffect, useRef } from 'react'

const ClickAway = ({ onClickAway, children }) => {
  const containerRef = useRef(null)

  const handleDocumentClick = useCallback(
    (event) => {
      if (containerRef.current && containerRef.current.contains(event.target)) {
        return
      }
      onClickAway()
    },
    [onClickAway],
  )

  useEffect(() => {
    document.addEventListener('mousedown', handleDocumentClick)
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
    }
  }, [handleDocumentClick])

  return <div ref={containerRef}>{children}</div>
}

export default ClickAway
