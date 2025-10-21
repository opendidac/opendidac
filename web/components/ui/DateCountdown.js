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
import { useState, useEffect } from 'react'
const DateCountdown = ({ untilDate, onTic, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState()
  const calculateTimeLeft = () => {
    const difference = new Date(untilDate) - new Date()
    let timeLeft = {}

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    } else {
      timeLeft = {
        hours: 0,
        minutes: 0,
        seconds: 0,
      }
      if (onFinish) {
        onFinish()
      }
    }

    return timeLeft
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      let timeLeft = calculateTimeLeft()
      setTimeLeft(timeLeft)
      if (onTic) {
        onTic(timeLeft)
      }
    }, 1000)
    // Clear timeout if the component is unmounted
    return () => clearTimeout(timer)
  })

  return (
    <>
      {timeLeft && (
        <>{`${timeLeft.hours.toString().padStart(2, '0')}:${timeLeft.minutes
          .toString()
          .padStart(2, '0')}`}</>
      )}
    </>
  )
}

export default DateCountdown
