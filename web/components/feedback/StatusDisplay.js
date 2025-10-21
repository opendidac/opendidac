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
import { Box } from '@mui/material'
import Image from 'next/image'

const StatusDisplay = ({ status, size = 16 }) => {
  const renderStatus = (status) => {
    switch (status) {
      case 'SUCCESS':
      case 'MATCH':
        return (
          <Image
            src="/svg/status/success.svg"
            width={size}
            height={size}
            alt="success"
          />
        )
      case 'ERROR':
      case 'MISMATCH':
        return (
          <Image
            src="/svg/status/error.svg"
            width={size}
            height={size}
            alt="error"
          />
        )
      case `MISSING`:
        return (
          <Image
            src="/svg/status/missing.svg"
            width={size}
            height={size}
            alt="missing"
          />
        )
      case 'WARNING':
        return (
          <Image
            src="/svg/status/warning.svg"
            width={size}
            height={size}
            alt="warning"
          />
        )
      case 'RUNNING':
        return (
          <Image
            src="/svg/status/running.svg"
            width={size}
            height={size}
            alt="running"
          />
        )
      case 'LOADING':
        return (
          <Image
            src="/svg/status/running.svg"
            width={size}
            height={size}
            alt="loading"
          />
        )
      case 'NEUTRAL':
        return (
          <Image
            src="/svg/status/neutral.svg"
            width={size}
            height={size}
            alt="neutral"
          />
        )
      case 'RELOAD':
        return (
          <Image
            src="/svg/status/reload.svg"
            width={size}
            height={size}
            alt="reload"
          />
        )
      case 'CLI':
        return (
          <Image
            src="/svg/status/cli.svg"
            width={size}
            height={size}
            alt="cli"
          />
        )
      case 'PROHIBITED':
        return (
          <Image
            src="/svg/status/prohibited.svg"
            width={size}
            height={size}
            alt="prohibited"
          />
        )

      case 'WIFI-ON':
        return <WifiOnIcon width={size} height={size} />
      case 'WIFI-OFF':
        return <WifiOffIcon width={size} height={size} />
      case 'WIFI-POOR':
        return <WifiPoorIcon width={size} height={size} />
      case 'WIFI-GOOD':
        return <WifiGoodIcon width={size} height={size} />
      case 'WIFI-FULL':
        return <WifiFullIcon width={size} height={size} />
      default:
        return (
          <Image
            src="/svg/status/empty.svg"
            width={size}
            height={size}
            alt="empty"
          />
        )
    }
  }
  return (
    <Box minWidth={size} minHeight={size} maxHeight={size} maxWidth={size}>
      {renderStatus(status)}
    </Box>
  )
}

/* Declare network related svgs as components so they are not loaded on demand and available when the connection is poor or offline for fast status switch */

const WifiOnIcon = ({ size }) => (
  <svg x="0px" y="0px" width={size} height={size} viewBox="0 0 24 24">
    <g transform="translate(0, 0)">
      <circle
        data-color="color-2"
        fill="#49a31e"
        cx="12"
        cy="18"
        r="3"
      ></circle>
      <path
        fill="#49a31e"
        d="M12,9c-2.404,0-4.664,0.936-6.364,2.636l-0.707,0.707l1.414,1.414L7.05,13.05C8.373,11.728,10.13,11,12,11 s3.627,0.728,4.95,2.05l0.707,0.707l1.414-1.414l-0.707-0.707C16.664,9.936,14.404,9,12,9z"
      ></path>
      <path
        fill="#49a31e"
        d="M22.606,7.394C19.774,4.561,16.007,3,12,3S4.226,4.561,1.394,7.394L0.687,8.101l1.414,1.414l0.707-0.707 C5.263,6.352,8.527,5,12,5s6.737,1.352,9.192,3.808l0.707,0.707l1.414-1.414L22.606,7.394z"
      ></path>
    </g>
  </svg>
)

const WifiOffIcon = ({ size }) => (
  <svg x="0px" y="0px" width={size} height={size} viewBox="0 0 24 24">
    <g transform="translate(0, 0)">
      <path
        fill="#da291c"
        d="M13.044 15.198l-3.846 3.846A2.996 2.996 0 0 0 12 21c1.654 0 3-1.346 3-3a2.996 2.996 0 0 0-1.956-2.802z"
      ></path>
      <path
        fill="#da291c"
        d="M7.05 13.05A6.956 6.956 0 0 1 12 11c.315 0 .624.028.931.069l1.684-1.684A8.994 8.994 0 0 0 12 9a8.943 8.943 0 0 0-6.364 2.636l-.707.707 1.414 1.414.707-.707z"
      ></path>
      <path
        fill="#da291c"
        d="M17.418 10.824l-1.428 1.428c.339.236.662.5.96.798l.707.707 1.414-1.414-.707-.707a9.18 9.18 0 0 0-.946-.812z"
      ></path>
      <path
        fill="#da291c"
        d="M2.808 8.808A12.91 12.91 0 0 1 12 5c2.004 0 3.933.464 5.683 1.317l1.491-1.491A14.913 14.913 0 0 0 12 3 14.9 14.9 0 0 0 1.394 7.394l-.707.707 1.414 1.414.707-.707z"
      ></path>
      <path
        fill="#da291c"
        d="M21.685 6.557l-1.414 1.414c.318.263.626.541.922.836l.707.707L23.314 8.1l-.707-.707a15.765 15.765 0 0 0-.922-.836z"
      ></path>
      <path
        data-color="color-2"
        fill="#da291c"
        d="M2.586 20L22 .586 23.414 2 4 21.414z"
      ></path>
    </g>
  </svg>
)

const WifiFullIcon = ({ size }) => (
  <svg x="0px" y="0px" width={size} height={size} viewBox="0 0 24 24">
    <g transform="translate(0, 0)">
      <circle
        data-color="color-2"
        fill="#49a31e"
        cx="12"
        cy="18"
        r="3"
      ></circle>
      <path
        fill="#49a31e"
        d="M12,9c-2.404,0-4.664,0.936-6.364,2.636l-0.707,0.707l1.414,1.414L7.05,13.05C8.373,11.728,10.13,11,12,11 s3.627,0.728,4.95,2.05l0.707,0.707l1.414-1.414l-0.707-0.707C16.664,9.936,14.404,9,12,9z"
      ></path>
      <path
        fill="#49a31e"
        d="M22.606,7.394C19.774,4.561,16.007,3,12,3S4.226,4.561,1.394,7.394L0.687,8.101l1.414,1.414l0.707-0.707 C5.263,6.352,8.527,5,12,5s6.737,1.352,9.192,3.808l0.707,0.707l1.414-1.414L22.606,7.394z"
      ></path>
    </g>
  </svg>
)

const WifiGoodIcon = ({ size }) => (
  <svg x="0px" y="0px" width={size} height={size} viewBox="0 0 24 24">
    <g transform="translate(0, 0)">
      <circle
        data-color="color-2"
        fill="#2196f3"
        cx="12"
        cy="18"
        r="3"
      ></circle>
      <path
        fill="#2196f3"
        d="M12,9c-2.404,0-4.664,0.936-6.364,2.636l-0.707,0.707l1.414,1.414L7.05,13.05C8.373,11.728,10.13,11,12,11 s3.627,0.728,4.95,2.05l0.707,0.707l1.414-1.414l-0.707-0.707C16.664,9.936,14.404,9,12,9z"
      ></path>
      <path
        fill="#2196f3"
        d="M22.606,7.394C19.774,4.561,16.007,3,12,3S4.226,4.561,1.394,7.394L0.687,8.101l1.414,1.414l0.707-0.707 C5.263,6.352,8.527,5,12,5s6.737,1.352,9.192,3.808l0.707,0.707l1.414-1.414L22.606,7.394z"
      ></path>
    </g>
  </svg>
)

const WifiPoorIcon = ({ size }) => (
  <svg x="0px" y="0px" width={size} height={size} viewBox="0 0 24 24">
    <g transform="translate(0, 0)">
      <circle
        data-color="color-2"
        fill="#f37820"
        cx="12"
        cy="18"
        r="3"
      ></circle>
      <path
        fill="#f37820"
        d="M12,9c-2.404,0-4.664,0.936-6.364,2.636l-0.707,0.707l1.414,1.414L7.05,13.05C8.373,11.728,10.13,11,12,11 s3.627,0.728,4.95,2.05l0.707,0.707l1.414-1.414l-0.707-0.707C16.664,9.936,14.404,9,12,9z"
      ></path>
    </g>
  </svg>
)

export default StatusDisplay
