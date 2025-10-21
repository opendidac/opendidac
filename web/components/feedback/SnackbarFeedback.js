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
import { Snackbar, Paper, Box, Stack, Typography } from '@mui/material'
import { useSnackbar } from '@/context/SnackbarContext'
import { useTheme } from '@mui/material'

const SnackbarFeedback = () => {
  const theme = useTheme()
  const {
    snackbar: {
      position: { vertical, horizontal },
      open,
      message,
      severity = 'success',
    },
    hide,
  } = useSnackbar()
  return (
    <Snackbar
      sx={{ mt: 5 }}
      anchorOrigin={{ vertical, horizontal }}
      open={open}
      autoHideDuration={3000}
      onClose={hide}
    >
      <Paper elevation={4}>
        <Stack direction="row" sx={{ p: 0 }}>
          <Box
            sx={{
              minWidth: 8,
              maxWidth: 8,
              backgroundColor: theme.palette[severity]?.main,
            }}
          ></Box>
          <Box sx={{ pl: 2, pr: 2, pt: 1, pb: 1 }}>
            <Typography variant="caption">{message}</Typography>
          </Box>
        </Stack>
      </Paper>
    </Snackbar>
  )
}

export default SnackbarFeedback
