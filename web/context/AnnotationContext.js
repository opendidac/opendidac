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

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
} from 'react'
import useSWR from 'swr'
import { fetcher } from '../core/utils'
import { useRouter } from 'next/router'
import { useDebouncedCallback } from 'use-debounce'
import AnnotationHighlight from '@/components/evaluations/grading/annotation/AnnotationHighlight'
import { AnnotationState } from '@/components/evaluations/grading/annotation/types'

const AnnotationContext = createContext()

export const useAnnotation = () => useContext(AnnotationContext)

const createAnnotation = async (
  groupScope,
  student,
  question,
  entityType,
  entity,
  annotation,
) => {
  const response = await fetch(`/api/${groupScope}/gradings/annotations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      student,
      question,
      entityType,
      entity,
      annotation,
    }),
  })
  const data = await response.json()
  return data
}

const updateAnnotation = async (groupScope, annotation) => {
  const response = await fetch(
    `/api/${groupScope}/gradings/annotations/${annotation.id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        annotation,
      }),
    },
  )

  const data = await response.json()
  return data
}

const discardAnnotation = async (groupScope, annotationId) => {
  if (annotationId) {
    await fetch(`/api/${groupScope}/gradings/annotations/${annotationId}`, {
      method: 'DELETE',
    })
  }
}

export const AnnotationProvider = ({
  children,
  annotation: immutableAnnotation,
  readOnly = false,
  student,
  question,
  entityType,
  entity,
}) => {
  const router = useRouter()

  const { groupScope } = router.query

  const doFetch = !readOnly && groupScope && entity?.id

  /* 
      When used in the context of student consultation, the annotation is immutable
      and is supplied as prop immutableAnnotation. The annotation is not managed by the context. It is only used to
      initialize the context state.
      When used in the context of grading, the annotation is mutable its data is managed by the context. The context
      fetches the annotation from the server and updates it when the user changes it.
  */
  const { data: contextAnnotation, mutate } = useSWR(
    doFetch &&
      `/api/${groupScope}/gradings/annotations?entityType=${entityType}&entityId=${entity.id}`,
    doFetch && fetcher,
  )

  const [annotation, setAnnotation] = useState(immutableAnnotation ?? null)
  const [state, setState] = useState(
    stateBasedOnAnnotation(immutableAnnotation),
  )

  const postInProgress = useRef(false)

  // Grading mode fetches the annotation after mount; consumers must not
  // seed editors until it resolves. Consultation mode is synchronous.
  const isLoading = !readOnly && contextAnnotation === undefined

  useEffect(() => {
    if (!doFetch) {
      setAnnotation(immutableAnnotation)
      setState(stateBasedOnAnnotation(immutableAnnotation))
    }
  }, [immutableAnnotation, doFetch])

  useEffect(() => {
    if (doFetch) {
      // Context Managed Annotation (Grading)
      setAnnotation(contextAnnotation)
      setState(stateBasedOnAnnotation(contextAnnotation))
    }
  }, [contextAnnotation, doFetch])

  // No revalidation after the PUT: the SWR cache is kept in sync with local
  // truth on every change (see `change`), and a refetch here can regress the
  // cache to older server content while newer keystrokes are still pending.
  const debouncedUpdateAnnotation = useDebouncedCallback(
    async (groupScope, annotation) => {
      await updateAnnotation(groupScope, annotation)
    },
    1000,
  )

  // Persist the last edits when the provider unmounts (participant or file
  // switch): unmount cancels pending debounced calls, losing up to 1s of
  // typing on a fast switch.
  useEffect(() => {
    return () => {
      debouncedUpdateAnnotation.flush()
    }
  }, [debouncedUpdateAnnotation])

  const change = useCallback(
    async (content) => {
      if (readOnly) {
        return
      }

      // Create a local copy of the current annotation state
      const updated = {
        ...annotation,
        content,
      }

      setAnnotation(updated)
      // Mirror local truth into the SWR cache so a remount of this entity
      // (participant switch round-trip) seeds from the latest content even
      // before the server catches up.
      mutate(updated, { revalidate: false })

      if (state === AnnotationState.NOT_ANNOTATED.value) {
        setState(AnnotationState.ANNOTATED.value)
      }

      // Prevent multiple POST requests for the same annotation,
      // Note that the annotation content is being updated in the state before this check

      if (!annotation?.id && !postInProgress.current) {
        postInProgress.current = true // Lock the POST request
        try {
          const newAnnotation = await createAnnotation(
            groupScope,
            student,
            question,
            entityType,
            entity,
            updated,
          )

          // Update the annotation with the new ID from the server
          setAnnotation((current) => {
            if (!current) {
              // Discarded while the POST was in flight: remove the freshly
              // created record instead of resurrecting it.
              discardAnnotation(groupScope, newAnnotation.id)
              return current
            }
            const withId = {
              ...current,
              id: newAnnotation.id,
            }
            // Cache the id without refetching: a refetch would serve the
            // first-keystroke content and clobber what was typed since.
            mutate(withId, { revalidate: false })
            // Compare the current content with the server response
            if (current.content !== newAnnotation.content) {
              // Catch up immediately with the content typed while the POST
              // was in flight — a debounce here would be cancelled if the
              // user switches participant right away.
              updateAnnotation(groupScope, withId)
            }
            return withId
          })
        } finally {
          postInProgress.current = false // Release the POST lock
        }
      } else if (annotation?.id) {
        // If the annotation already has an ID, send a PUT request
        debouncedUpdateAnnotation(groupScope, updated)
      }
    },
    [
      annotation,
      debouncedUpdateAnnotation,
      entity,
      entityType,
      groupScope,
      mutate,
      question,
      readOnly,
      setAnnotation,
      setState,
      state,
      student,
    ],
  )

  const discard = useCallback(async () => {
    if (readOnly) {
      return
    }
    // Drop any pending debounced save so it cannot fire after the DELETE
    // and resurrect the annotation on the server.
    debouncedUpdateAnnotation.cancel()
    const annotationId = annotation.id
    setAnnotation(null)
    setState(AnnotationState.NOT_ANNOTATED.value)
    await discardAnnotation(groupScope, annotationId)
    // Write the deletion into the SWR cache: otherwise a later remount of
    // this entity is served the stale cached annotation before revalidation.
    mutate(null, { revalidate: false })
  }, [groupScope, annotation, readOnly, mutate, debouncedUpdateAnnotation])

  return (
    <AnnotationContext.Provider
      value={{
        readOnly,
        state,
        annotation,
        change,
        discard,
        isLoading,
      }}
    >
      <AnnotationHighlight readOnly={readOnly} state={state}>
        {children}
      </AnnotationHighlight>
    </AnnotationContext.Provider>
  )
}

const stateBasedOnAnnotation = (annotation) => {
  return annotation
    ? AnnotationState.ANNOTATED.value
    : AnnotationState.NOT_ANNOTATED.value
}
