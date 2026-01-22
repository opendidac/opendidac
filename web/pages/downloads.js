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

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import Image from 'next/image'
import BackButton from '@/components/layout/BackButton'

const GITHUB_RELEASE_URL =
  'https://github.com/opendidac/opendidac_desktop_release/releases/download/v1.0.0'

const OS_DOWNLOADS = [
  {
    id: 'windows',
    name: 'Windows',
    iconPath: '/svg/os/windows.svg',
    downloadUrl: `${GITHUB_RELEASE_URL}/OpenDidac.Desktop-1.0.0.Setup.exe`,
    filename: 'OpenDidac.Desktop-1.0.0.Setup.exe',
    instructions: [
      'Download the Windows installer (.exe file)',
      'Run the installer',
      'If Windows Defender displays "Windows protected your PC", click on "More info" and then "Run anyway"',
      'The setup will install and run the application automatically.',
      'When the app opens, you will be prompted to enter a 6-character PIN',
      'Enter the PIN provided by your professor to join the evaluation',
    ],
  },
  {
    id: 'macos',
    name: 'macOS',
    iconPath: '/svg/os/macos.svg',
    downloadUrl: {
      arm64: `${GITHUB_RELEASE_URL}/OpenDidac.Desktop-darwin-arm64-1.0.0.zip`,
      x64: `${GITHUB_RELEASE_URL}/OpenDidac.Desktop-darwin-x64-1.0.0.zip`,
    },
    filename: {
      arm64: 'OpenDidac.Desktop-darwin-arm64-1.0.0.zip',
      x64: 'OpenDidac.Desktop-darwin-x64-1.0.0.zip',
    },
    instructions: [
      'Download the macOS application (.zip file) for your Mac type:',
      '• Apple Silicon (M1, M2, M3, etc.) - ARM64 version',
      '• Intel Mac - x64 version',
      'Extract the ZIP file to your Applications folder',
      'Open Terminal and run the following command (replace with your actual path):',
      '  xattr -d com.apple.quarantine "/Applications/OpenDidac Desktop.app"',
      'If you see a security warning, go to System Preferences > Security & Privacy and click "Open Anyway"',
      'Launch OpenDidac Desktop from your Applications folder',
      'When the app opens, you will be prompted to enter a 6-character PIN',
      'Enter the PIN provided by your professor to join the evaluation',
    ],
  },
  {
    id: 'linux',
    name: 'Linux',
    iconPath: '/svg/os/linux.svg',
    downloadUrl: {
      deb: `${GITHUB_RELEASE_URL}/opendidac-desktop_1.0.0_amd64.deb`,
      rpm: `${GITHUB_RELEASE_URL}/opendidac_desktop-1.0.0-1.x86_64.rpm`,
    },
    filename: {
      deb: 'opendidac-desktop_1.0.0_amd64.deb',
      rpm: 'opendidac_desktop-1.0.0-1.x86_64.rpm',
    },
    instructions: [
      'Download the appropriate package for your distribution (.deb or .rpm)',
      'Install using your package manager',
      'Run the application from your applications menu',
      'When the app opens, you will be prompted to enter a 6-character PIN',
      'Enter the PIN provided by your professor to join the evaluation',
    ],
  },
]

const DownloadCard = ({ os }) => {
  const isLinux = os.id === 'linux'
  const isMacOS = os.id === 'macos'

  return (
    <Card
      sx={{
        maxWidth: 500,
        margin: 'auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
      }}
    >
      <CardContent
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Stack spacing={3} alignItems="center" sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              src={os.iconPath}
              alt={`${os.name} icon`}
              width={64}
              height={64}
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Typography variant="h4" component="h2" textAlign="center">
            {os.name}
          </Typography>
        </Stack>

        <Stack spacing={2} sx={{ flexGrow: 1 }}>
          {isLinux ? (
            <Stack spacing={1}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                href={os.downloadUrl.deb}
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
                sx={{ mb: 1 }}
              >
                Download .deb (Debian/Ubuntu)
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                href={os.downloadUrl.rpm}
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
              >
                Download .rpm (Red Hat/Fedora)
              </Button>
            </Stack>
          ) : isMacOS ? (
            <Stack spacing={1}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                href={os.downloadUrl.arm64}
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
                sx={{ mb: 1 }}
              >
                Download for Apple Silicon (ARM64)
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                href={os.downloadUrl.x64}
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
              >
                Download for Intel (x64)
              </Button>
            </Stack>
          ) : (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              href={os.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
              size="large"
            >
              Download for {os.name}
            </Button>
          )}

          <Box>
            <Typography variant="h6" gutterBottom>
              Installation Instructions:
            </Typography>
            <Stack component="ol" spacing={1} sx={{ pl: 2.5, mt: 1 }}>
              {os.instructions.map((instruction, index) => (
                <Typography
                  key={index}
                  component="li"
                  variant="body2"
                  sx={{ whiteSpace: 'pre-line' }}
                >
                  {instruction}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

const Downloads = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Box>
          <BackButton backUrl={'/'} />
          <Typography
            variant="h3"
            component="h1"
            textAlign="center"
            gutterBottom
          >
            Download OpenDidac Desktop
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary">
            Choose your operating system to download the desktop application
          </Typography>
        </Box>

        <Box>
          <Alert severity="warning">
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Important: Authentication Requirements
            </Typography>
            <Typography variant="body2" component="div">
              Since you will be using the desktop application, your
              browser&apos;s saved passwords will not be available. Make sure
              you have:
            </Typography>
            <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, mt: 1, mb: 0 }}>
              <Typography component="li" variant="body2">
                Your Switch edu ID username and password
              </Typography>
              <Typography component="li" variant="body2">
                Access to your authenticator app
              </Typography>
            </Stack>
          </Alert>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(3, 1fr)',
            },
            gap: 4,
            mt: 4,
          }}
        >
          {OS_DOWNLOADS.map((os) => (
            <DownloadCard key={os.id} os={os} />
          ))}
        </Box>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Reach out to your professor for any questions or support.
          </Typography>
        </Box>
      </Stack>
    </Container>
  )
}

Downloads.requireAuth = false

export default Downloads
