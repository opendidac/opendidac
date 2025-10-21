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
import { Drawer, Stack } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
const ResizableDrawer = ({ open, width: initial = 70, onClose, children }) => {
  const [contentVisible, setContentVisible] = useState(false) // prevent content from rerendering when drawer animates open

  const [dragging, setDragging] = useState(false)
  const [width, setWidth] = useState(initial)
  const ref = useRef(null)

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragging || !window) return
      const newWidth =
        ((window.innerWidth - e.clientX) / window.innerWidth) * 100
      setWidth(newWidth)
    },
    [dragging],
  )

  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [])

  useEffect(() => {
    // Delay content rendering when the drawer is opened and not dragging
    if (open) {
      const timer = setTimeout(() => setContentVisible(true), 300) // Adjust delay as needed
      return () => clearTimeout(timer)
    } else {
      setContentVisible(false)
    }
  }, [open])

  useEffect(() => {
    if (!document) return

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, ref, handleMouseMove, handleMouseUp])

  return (
    <Drawer
      anchor={'right'}
      open={open}
      PaperProps={{ style: { width: `${width}vw`, zIndex: 1 } }}
      onClose={() => onClose()}
      ref={ref}
    >
      <Stack direction={'row'} width={'100%'} height={'100%'}>
        <Stack
          width={'24px'}
          zIndex={2}
          alignItems={'center'}
          justifyContent={'center'}
          sx={{ cursor: 'ew-resize' }}
          onMouseDown={(e) => setDragging(true)}
          bgcolor={'background.default'}
        >
          <ResizeHandleIcon />
        </Stack>
        <Stack flex={1} height={'100%'} overflow={'auto'}>
          {contentVisible && children}
        </Stack>
      </Stack>
    </Drawer>
  )
}
const ResizeHandleIcon = () => {
  return (
    <svg
      width="10"
      height="48"
      viewBox="0 0 10 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1" height="100" fill="gray" />
      <rect x="8" width="1" height="100" fill="gray" />
    </svg>
  )
}

export default ResizableDrawer
