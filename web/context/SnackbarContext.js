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
import React, { createContext, useState, useContext, useCallback } from 'react'
import SnackbarFeedback from '../components/feedback/SnackbarFeedback'

const SnackbarContext = createContext()
export const useSnackbar = () => useContext(SnackbarContext)

const defaultPosition = {
  vertical: 'bottom',
  horizontal: 'left',
}
export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    position: defaultPosition,
    message: '',
  })

  const show = useCallback((message, severity) => {
    setSnackbar({
      position: defaultPosition,
      open: true,
      message,
      severity,
    })
  }, [])

  const showAt = useCallback((position, message, severity) => {
    setSnackbar({
      position,
      open: true,
      message,
      severity,
    })
  }, [])

  const showTopRight = useCallback((message, severity) => {
    setSnackbar({
      position: {
        vertical: 'top',
        horizontal: 'right',
      },
      open: true,
      message,
      severity,
    })
  }, [])

  const showTopCenter = useCallback((message, severity) => {
    setSnackbar({
      position: {
        vertical: 'top',
        horizontal: 'center',
      },
      open: true,
      message,
      severity,
    })
  }, [])

  const showBottomRight = useCallback((message, severity) => {
    setSnackbar({
      position: {
        vertical: 'bottom',
        horizontal: 'right',
      },
      open: true,
      message,
      severity,
    })
  }, [])

  const hide = () => {
    setSnackbar({ ...snackbar, open: false, message: '', severity: 'success' })
  }

  return (
    <SnackbarContext.Provider
      value={{
        snackbar,
        show,
        showAt,
        showTopRight,
        showTopCenter,
        showBottomRight,
        hide,
      }}
    >
      {children}
      <SnackbarFeedback />
    </SnackbarContext.Provider>
  )
}
