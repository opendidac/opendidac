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
import {
  createContext,
  useCallback,
  useRef,
  useState,
  useContext,
} from 'react'
import { useTheme } from '@mui/material/styles'

const ReorderableContext = createContext(null)

export const useReorderable = () => {
  const context = useContext(ReorderableContext)
  if (!context) {
    throw new Error('useReorderable must be used within a ReorderableList')
  }
  return context
}

const ReorderableList = ({ children, onChangeOrder, onOrderEnd, disabled }) => {
  const theme = useTheme()
  const [sourceIndex, setSourceIndex] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const lastTargetIndex = useRef(null)

  const handleOrderChange = useCallback(
    (targetIndex) => {
      if (
        !disabled && // Prevent order changes if disabled
        targetIndex !== sourceIndex &&
        sourceIndex !== null &&
        targetIndex !== null
      ) {
        if (targetIndex !== lastTargetIndex.current) {
          onChangeOrder(sourceIndex, targetIndex)
          lastTargetIndex.current = targetIndex
          setSourceIndex(targetIndex) // Update the sourceIndex after changing the order
        }
      }
    },
    [sourceIndex, onChangeOrder, disabled],
  )

  const handleDragStart = useCallback(
    (e, index) => {
      if (!disabled) {
        setSourceIndex(index)
        setIsDragging(true)
        lastTargetIndex.current = null // Reset the last target index on drag start
      }
    },
    [disabled],
  )

  const handleDragOver = useCallback(
    (e, targetIndex) => {
      if (!disabled) {
        e.preventDefault()
        handleOrderChange(targetIndex)
      }
    },
    [handleOrderChange, disabled],
  )

  const handleDragEnd = useCallback(() => {
    if (!disabled) {
      setSourceIndex(null)
      setIsDragging(false)
      if (onOrderEnd) {
        onOrderEnd(lastTargetIndex.current) // Use lastTargetIndex.current for the final position
      }
    }
  }, [onOrderEnd, disabled])

  const getDragStyles = useCallback(
    (index) => {
      if (!isDragging) return {}

      const isBeingDragged = sourceIndex === index

      return {
        opacity: isBeingDragged ? 0.75 : 1,
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        transform: isBeingDragged ? 'scale(0.99)' : 'scale(1)',
        position: 'relative',
        '&::after': isBeingDragged
          ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              border: `2px dashed ${theme.palette.primary.main}`,
              borderRadius: '4px',
              pointerEvents: 'none',
            }
          : {},
      }
    },
    [isDragging, sourceIndex, theme.palette.primary.main],
  )

  const value = {
    sourceIndex,
    isDragging,
    disabled,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    getDragStyles,
  }

  return (
    <ReorderableContext.Provider value={value}>
      {children}
    </ReorderableContext.Provider>
  )
}

export default ReorderableList
