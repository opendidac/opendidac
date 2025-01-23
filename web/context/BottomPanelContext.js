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
import React, { createContext, useContext, useState, useCallback } from 'react'

const BottomPanelContext = createContext()

export const useBottomPanel = () => {
  return useContext(BottomPanelContext)
}

export const BottomPanelProvider = ({ open, onChange, children }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(open || false)

  console.log("BottomPanelProvider render, isPanelOpen", isPanelOpen)

  const toggleOpen = useCallback(() => {
    const newIsPanelOpen = !isPanelOpen
    setIsPanelOpen(newIsPanelOpen)
    onChange && onChange(newIsPanelOpen)
  }, [onChange, isPanelOpen])

  const openPanel = useCallback(() => {
    console.log('openPanel', isPanelOpen)
    
    if (isPanelOpen) return
    
    setIsPanelOpen(true)
    onChange && onChange(true)
  }, [onChange, isPanelOpen])

  const closePanel = useCallback(() => {
    if (!isPanelOpen) return
    setIsPanelOpen(false)
    onChange && onChange(false)
  }, [onChange, isPanelOpen])

  const value = {
    isPanelOpen,
    toggleOpen,
    openPanel,
    closePanel,
  }

  return (
    <BottomPanelContext.Provider value={value}>
      {children}
    </BottomPanelContext.Provider>
  )
}
