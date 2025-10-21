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
import React, { useRef, useState, useEffect, useCallback } from 'react'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import CloseIcon from '@mui/icons-material/Close'

import {
  IconButton,
  Paper,
  Popper,
  Stack,
  Fade,
  Box,
  Typography,
} from '@mui/material'

const UserHelpPopper = ({
  children,
  label,
  placement = 'bottom',
  mode = 'info',
  size = 'small',
  width = 300,
  maxHeight = 700,
  onChildOpen, // Add this prop to track child open state
}) => {
  const popperRef = useRef(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [open, setOpen] = useState(false)

  const handleToggle = (event) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
    const newOpenState = !open
    setOpen(newOpenState)
    if (onChildOpen) onChildOpen(newOpenState) // Notify parent popper about the state change
  }

  const id = open ? 'simple-popper' : undefined

  const getIcon = () => {
    switch (mode) {
      case 'help':
        return <HelpOutlineOutlinedIcon />
      case 'info':
        return <InfoOutlinedIcon />
      case 'warning':
        return <WarningAmberOutlinedIcon />
      case 'error':
        return <ErrorOutlineOutlinedIcon />
      case 'success':
        return <CheckCircleOutlineOutlinedIcon />
      default:
        return <InfoOutlinedIcon />
    }
  }

  const handleDocumentClick = useCallback(
    (event) => {
      if (popperRef.current && popperRef.current.contains(event.target)) {
        return
      }
      setOpen(false)
      if (onChildOpen) onChildOpen(false) // Notify parent popper to close
    },
    [onChildOpen],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleDocumentClick)
    } else {
      document.removeEventListener('mousedown', handleDocumentClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
    }
  }, [open, handleDocumentClick])

  const handlePaperMouseDown = (event) => {
    event.stopPropagation()
  }

  return (
    <Box>
      <Stack
        direction="row"
        spacing={0}
        alignItems="center"
        justifyContent="center"
        sx={{
          cursor: 'pointer',
        }}
        onClick={handleToggle}
      >
        <IconButton color={mode} size={size} aria-label={`${mode} info`}>
          {open ? <CloseIcon color="error" fontSize={size} /> : getIcon()}
        </IconButton>
        {label && <Typography variant="caption">{label}</Typography>}
      </Stack>
      <Popper
        id={id}
        ref={popperRef}
        open={open}
        anchorEl={anchorEl}
        placement={placement}
        transition
        sx={{ zIndex: 10000 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper
              elevation={3}
              ref={popperRef}
              onMouseDown={handlePaperMouseDown}
              onClick={(e) => e.stopPropagation()}
            >
              <Stack
                p={2}
                maxWidth={Math.max(width, 700)}
                maxHeight={maxHeight}
                bgcolor="background.paper"
                overflow="auto"
              >
                {children}
              </Stack>
            </Paper>
          </Fade>
        )}
      </Popper>
    </Box>
  )
}

export default UserHelpPopper
