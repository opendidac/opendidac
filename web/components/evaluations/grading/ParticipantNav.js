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
import { useCallback, useEffect, useRef, useState } from 'react'
import { Stack, Box, Button } from '@mui/material'
import Image from 'next/image'

import UserAvatar from '@/components/layout/UserAvatar'
import FilledBullet from '@/components/feedback/FilledBullet'
import { forwardRef } from 'react'

const ParticipantItem = forwardRef(
  ({ participant, active, collapsed, onClick, isFilled }, ref) => {
    return (
      <Stack
        ref={ref}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ pt: 1, pr: 1, pb: 1, display: 'inline-flex', cursor: 'pointer' }}
        onClick={onClick}
      >
        <Stack direction="row" spacing={0}>
          {active ? (
            <Box sx={{ width: 2, bgcolor: 'primary.main' }} />
          ) : (
            <Box sx={{ width: 2, bgcolor: 'transparent' }} />
          )}
          <UserAvatar collapsed={collapsed} user={participant} />
        </Stack>
        <FilledBullet state={isFilled ? 'filled' : 'empty'} />
      </Stack>
    )
  },
)

ParticipantItem.displayName = 'ParticipantItem'

const ParticipantNav = ({
  participants,
  active,
  onParticipantClick,
  isParticipantFilled,
}) => {
  const [collapsed, setCollapsed] = useState(true)

  const participantRefs = useRef({}) // for auto-scrolling

  useEffect(() => {
    if (active && participantRefs && participantRefs.current[active.id]) {
      // Wrap the scrollIntoView call in a microtask
      setTimeout(() => {
        participantRefs.current[active.id]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }, 100)
    }
  }, [active, participantRefs])

  const navigateParticipants = useCallback(
    (direction) => {
      let index = participants.findIndex((p) => p.id === active.id)
      if (direction === 'up' && index > 0) {
        onParticipantClick(participants[index - 1])
      } else if (direction === 'down' && index < participants.length - 1) {
        onParticipantClick(participants[index + 1])
      }
    },
    [participants, active, onParticipantClick],
  )

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey) {
        if (event.key === 'ArrowUp') {
          navigateParticipants('up')
        } else if (event.key === 'ArrowDown') {
          navigateParticipants('down')
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigateParticipants])

  return (
    <Stack
      spacing={0}
      sx={{ p: 1, display: 'inline-flex', bgcolor: 'background.paper' }}
    >
      <Button onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? (
          <Image
            src={`/svg/grading/expand.svg`}
            alt="Arrow"
            width={16}
            height={16}
          />
        ) : (
          <Image
            src={`/svg/grading/collapse.svg`}
            alt="Arrow"
            width={16}
            height={16}
          />
        )}
      </Button>
      <Stack flex={1} sx={{ overflow: 'auto' }}>
        {participants.map((participant) => (
          <ParticipantItem
            key={participant.id}
            ref={(el) => (participantRefs.current[participant.id] = el)}
            active={active && active.id === participant.id}
            collapsed={collapsed}
            participant={participant}
            onClick={() => onParticipantClick(participant)}
            isFilled={isParticipantFilled(participant)}
          />
        ))}
      </Stack>
    </Stack>
  )
}

export default ParticipantNav
