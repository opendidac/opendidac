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
import { Stack } from '@mui/material'
import { useTheme } from '@emotion/react'

const FilledBullet = ({ state = 'empty', color = 'info', size = 12 }) => {
  const theme = useTheme()

  const bulletColor = theme.palette[color].main

  return (
    <Stack
      sx={{ width: '20px', height: '20px' }}
      alignItems="center"
      justifyContent="center"
    >
      {state === 'empty' && <EmptyBulletIcon color={bulletColor} size={size} />}
      {state === 'half' && (
        <HalfFilledBulletIcon color={bulletColor} size={size} />
      )}
      {state === 'filled' && (
        <FilledBulletIcon color={bulletColor} size={size} />
      )}
    </Stack>
  )
}

const EmptyBulletIcon = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit="10"
      strokeWidth="2"
      strokeLinejoin="miter"
    />
  </svg>
)

const HalfFilledBulletIcon = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <defs>
      <clipPath id="halfClip">
        <rect x="0" y="0" width="12" height="24" />
      </clipPath>
    </defs>
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke={color}
      strokeLinecap="square"
      strokeMiterlimit="10"
      strokeWidth="2"
      strokeLinejoin="miter"
    />
    <circle cx="12" cy="12" r="10" fill={color} clipPath="url(#halfClip)" />
  </svg>
)

const FilledBulletIcon = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12,1A11,11,0,1,0,23,12,11.012,11.012,0,0,0,12,1Z" fill={color} />
  </svg>
)

export default FilledBullet
