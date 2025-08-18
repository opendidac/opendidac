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
import { Button } from '@mui/material'
import NextImage from 'next/image'

const ExportPdfButton = ({
  groupScope,
  evaluationId,
  variant = 'text',
  color = 'primary',
  size = 'medium',
  children = 'Export as PDF',
  startIcon,
  ...buttonProps
}) => {
  const handleExport = () => {
    window.open(
      `/api/${groupScope}/evaluations/${evaluationId}/export`,
      '_blank',
    )
  }

  const defaultIcon = (
    <NextImage
      alt="Export"
      src="/svg/icons/file-pdf.svg"
      width="22"
      height="22"
    />
  )

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      onClick={handleExport}
      startIcon={startIcon || defaultIcon}
      {...buttonProps}
    >
      {children}
    </Button>
  )
}

export default ExportPdfButton
