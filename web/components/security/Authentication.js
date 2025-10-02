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

/**
 * Authentication owns useSession().
 * - Mounts <ConnectionManager/> only when authenticated
 * - Listens for 'auth-unauthenticated' and calls signOut()
 */
import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import LoadingAnimation from '../feedback/Loading'
import LoginScreen from './LoginScreen'
import ConnectionManager from '../layout/ConnectionManager'

const Authentication = ({ children }) => {
  const { status } = useSession()

  useEffect(() => {
    const onAuthInvalid = () => {
      signOut()
    }
    window.addEventListener('auth-unauthenticated', onAuthInvalid)
    return () =>
      window.removeEventListener('auth-unauthenticated', onAuthInvalid)
  }, [])

  return (
    <>
      {status === 'loading' && <LoadingAnimation />}
      {status === 'unauthenticated' && <LoginScreen />}
      {status === 'authenticated' && (
        <>
          <ConnectionManager />
          {children}
        </>
      )}
    </>
  )
}

export default Authentication
