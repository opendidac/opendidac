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

import { useEffect, useCallback } from 'react'

const CLIPBOARD_MARKER = 'application/x-opendidac-clipboard'

// Type-safe violation reasons
export type PasteViolationReason = 'external' | 'cross-evaluation' | 'invalid'
export type DragViolationReason = 'drag-external' | 'drag-cross-evaluation' // Phase 2
export type ViolationReason = PasteViolationReason | DragViolationReason

interface ClipboardMarker {
  evaluationId: string
  timestamp: number
}

interface UseClipboardProtectionOptions {
  evaluationId: string | undefined
  onViolation?: (reason: ViolationReason) => void
}

export const useClipboardProtection = ({
  evaluationId,
  onViolation,
}: UseClipboardProtectionOptions): void => {
  // Mark outgoing data (copy/cut/dragstart) with evaluation ID
  // Returns true if we handled text/plain ourselves (need to preventDefault)
  const markDataTransfer = useCallback(
    (dataTransfer: DataTransfer): boolean => {
      if (!evaluationId) return false

      // Check if an editor (Monaco) already populated clipboardData
      const hasContent = dataTransfer.types.includes('text/plain')

      if (!hasContent) {
        // Regular text selection - get it ourselves
        const selection = window.getSelection()?.toString()
        if (selection) {
          dataTransfer.setData('text/plain', selection)
        } else {
          // Check for input/textarea selection
          const active = document.activeElement
          if (
            active instanceof HTMLInputElement ||
            active instanceof HTMLTextAreaElement
          ) {
            const text = active.value.substring(
              active.selectionStart ?? 0,
              active.selectionEnd ?? 0,
            )
            if (text) {
              dataTransfer.setData('text/plain', text)
            }
          }
        }
      }

      dataTransfer.setData(
        CLIPBOARD_MARKER,
        JSON.stringify({
          evaluationId,
          timestamp: Date.now(),
        } satisfies ClipboardMarker),
      )

      // If we set text/plain ourselves, we need to preventDefault
      return !hasContent
    },
    [evaluationId],
  )

  // Validate incoming data (paste/drop) - returns violation reason or null if valid
  const validateDataTransfer = useCallback(
    (
      dataTransfer: DataTransfer,
      externalReason: ViolationReason,
      crossEvalReason: ViolationReason,
    ): ViolationReason | null => {
      if (!evaluationId) return null

      const markerData = dataTransfer.getData(CLIPBOARD_MARKER)

      if (!markerData) return externalReason

      try {
        const marker: ClipboardMarker = JSON.parse(markerData)
        if (marker.evaluationId !== evaluationId) return crossEvalReason
      } catch {
        return externalReason
      }

      return null
    },
    [evaluationId],
  )

  const handleCopy = useCallback(
    (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      const needsPreventDefault = markDataTransfer(e.clipboardData)
      if (needsPreventDefault) {
        e.preventDefault()
      }
    },
    [markDataTransfer],
  )

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      const violation = validateDataTransfer(
        e.clipboardData,
        'external',
        'cross-evaluation',
      )
      if (violation) {
        e.preventDefault()
        e.stopPropagation()
        onViolation?.(violation)
      }
    },
    [validateDataTransfer, onViolation],
  )

  const handleDragStart = useCallback(
    (e: DragEvent) => {
      if (!e.dataTransfer) return
      markDataTransfer(e.dataTransfer)
    },
    [markDataTransfer],
  )

  const handleDrop = useCallback(
    (e: DragEvent) => {
      if (!e.dataTransfer) return
      const violation = validateDataTransfer(
        e.dataTransfer,
        'drag-external',
        'drag-cross-evaluation',
      )
      if (violation) {
        e.preventDefault()
        e.stopPropagation()
        onViolation?.(violation)
      }
    },
    [validateDataTransfer, onViolation],
  )

  useEffect(() => {
    // Don't register listeners until evaluationId is available
    if (!evaluationId) return

    // Bubble phase for copy/cut/dragstart: let Monaco handle text first, then add marker
    document.addEventListener('copy', handleCopy, false)
    document.addEventListener('cut', handleCopy, false)
    document.addEventListener('dragstart', handleDragStart, false)
    // Capture phase for paste/drop: intercept before Monaco to block if needed
    document.addEventListener('paste', handlePaste, true)
    document.addEventListener('drop', handleDrop, true)

    return () => {
      document.removeEventListener('copy', handleCopy, false)
      document.removeEventListener('cut', handleCopy, false)
      document.removeEventListener('dragstart', handleDragStart, false)
      document.removeEventListener('paste', handlePaste, true)
      document.removeEventListener('drop', handleDrop, true)
    }
  }, [evaluationId, handleCopy, handlePaste, handleDragStart, handleDrop])
}
