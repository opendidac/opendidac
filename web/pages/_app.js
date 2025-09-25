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
import Head from 'next/head'
import { ThemeProvider, createTheme } from '@mui/material/styles'

import CssBaseline from '@mui/material/CssBaseline'
import { SessionProvider } from 'next-auth/react'
import { SnackbarProvider } from '../context/SnackbarContext'

import '../styles/normalize.css'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

import Authentication from '../components/security/Authentication'
import { TagsProvider } from '../context/TagContext'
import { GroupProvider } from '../context/GroupContext'
import ConnectionManager from '@/components/layout/ConnectionManager'

export const themeOptions = {
  palette: {
    type: 'light',
    primary: {
      main: '#da291c',
      contrastText: '#ffffff',
      dark: '#da291c',
    },
    secondary: {
      main: '#4c36f3',
    },
    divider: '#b5b5b5',
    background: {
      default: '#f3f3f3',
      paper: '#fafafa',
    },
  },
  typography: {
    fontFamily: 'Roboto',
    fontSize: 12,
    fontWeightLight: 400,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,

    h1: {
      fontSize: '2rem',
    },
    h2: {
      fontSize: '1.75rem',
    },
    h3: {
      fontSize: '1.5rem',
    },
    h4: {
      fontSize: '1.25rem',
    },
    h5: {
      fontSize: '1rem',
    },
    h6: {
      fontSize: '0.9rem',
    },
    body1: {
      fontSize: '0.9rem',
      color: '#333333',
    },
    body2: {
      fontSize: '0.85rem',
      color: '#7e7e7e',
    },
    button: {
      fontSize: '0.8rem',
    },
    caption: {
      fontSize: '0.7rem',
    },
  },
}

const theme = createTheme(themeOptions)

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  // Require authorization by default, unless explicitly specified otherwise
  const requireAuth = (Component.requireAuth === undefined) || Component.requireAuth
  return (
    <ThemeProvider theme={theme}>
      <SessionProvider session={session}>
        <ConnectionManager />
        <SnackbarProvider>
          <CssBaseline />
          <Meta />
          {requireAuth ? (
            <Authentication>
              <TagsProvider>
                <GroupProvider>
                  <Component {...pageProps} />
                </GroupProvider>
              </TagsProvider>
            </Authentication>
          ) : (
            <Component {...pageProps} />
          )}
        </SnackbarProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}

const Meta = () => (
  <Head>
    <title>HEIG-VD - EVAL</title>
    <meta name="description" content="HEIG-VD - Eval Platform" />
    <link rel="icon" href="/favicon.ico" />
  </Head>
)

export default MyApp
