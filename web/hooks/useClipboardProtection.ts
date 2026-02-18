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
  const markDataTransfer = useCallback(
    (dataTransfer: DataTransfer) => {
      if (!evaluationId) return false

      const selection = window.getSelection()?.toString()
      if (selection) {
        dataTransfer.setData('text/plain', selection)
        dataTransfer.setData(
          CLIPBOARD_MARKER,
          JSON.stringify({
            evaluationId,
            timestamp: Date.now(),
          } satisfies ClipboardMarker),
        )
        return true
      }
      return false
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
      if (markDataTransfer(e.clipboardData)) {
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

    // Capture phase ensures we intercept before Monaco/other editors
    document.addEventListener('copy', handleCopy, true)
    document.addEventListener('cut', handleCopy, true)
    document.addEventListener('paste', handlePaste, true)
    document.addEventListener('dragstart', handleDragStart, true)
    document.addEventListener('drop', handleDrop, true)

    return () => {
      document.removeEventListener('copy', handleCopy, true)
      document.removeEventListener('cut', handleCopy, true)
      document.removeEventListener('paste', handlePaste, true)
      document.removeEventListener('dragstart', handleDragStart, true)
      document.removeEventListener('drop', handleDrop, true)
    }
  }, [evaluationId, handleCopy, handlePaste, handleDragStart, handleDrop])
}
