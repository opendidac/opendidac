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
  const handleCopy = useCallback(
    (e: ClipboardEvent) => {
      if (!evaluationId || !e.clipboardData) return

      const selection = window.getSelection()?.toString()
      if (selection) {
        e.clipboardData.setData('text/plain', selection)
        e.clipboardData.setData(
          CLIPBOARD_MARKER,
          JSON.stringify({
            evaluationId,
            timestamp: Date.now(),
          } satisfies ClipboardMarker),
        )
        e.preventDefault()
      }
    },
    [evaluationId],
  )

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      // Guard is redundant (useEffect won't register without this), but keeps TypeScript happy
      if (!evaluationId) return
      if (!e.clipboardData) return

      const markerData = e.clipboardData.getData(CLIPBOARD_MARKER)

      if (!markerData) {
        e.preventDefault()
        e.stopPropagation()
        onViolation?.('external')
        return
      }

      try {
        const marker: ClipboardMarker = JSON.parse(markerData)
        if (marker.evaluationId !== evaluationId) {
          e.preventDefault()
          e.stopPropagation()
          onViolation?.('cross-evaluation')
          return
        }
      } catch {
        e.preventDefault()
        e.stopPropagation()
        onViolation?.('invalid')
        return
      }

      // Valid: same evaluation, allow paste
    },
    [evaluationId, onViolation],
  )

  useEffect(() => {
    // Don't register listeners until evaluationId is available
    if (!evaluationId) return

    // Capture phase ensures we intercept before Monaco/other editors
    document.addEventListener('copy', handleCopy, true)
    document.addEventListener('cut', handleCopy, true)
    document.addEventListener('paste', handlePaste, true)

    return () => {
      document.removeEventListener('copy', handleCopy, true)
      document.removeEventListener('cut', handleCopy, true)
      document.removeEventListener('paste', handlePaste, true)
    }
  }, [evaluationId, handleCopy, handlePaste])
}
