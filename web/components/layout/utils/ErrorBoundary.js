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
import { Stack, Button, Typography, Alert } from '@mui/material'
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)

    // Define a state variable to track whether is an error or not
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI

    return { hasError: true }
  }
  componentDidCatch(error, errorInfo) {
    // You can use your own error logging service here
    console.log({ error, errorInfo })
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.hasError && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }
  render() {
    // Check if the error is thrown
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Stack>
          <Alert severity="error">
            <Typography variant="caption">Something went wrong</Typography>
          </Alert>
          <Button onClick={() => this.setState({ hasError: false })}>
            Refresh
          </Button>
        </Stack>
      )
    }

    // Return children components in case of no error

    return this.props.children
  }
}

export default ErrorBoundary
