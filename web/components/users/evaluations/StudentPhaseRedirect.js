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
import { useRouter } from 'next/router'
import {
  phasePageRelationship,
  studentPhaseRedirect,
} from '../../../code/phase'
/*
    Checks if the current pathname corresponds to the expected pathname for the current phase.
    If not, redirects to the expected pathname.
    If yes, renders the children.
*/
const StudentPhaseRedirect = ({ phase, children }) => {
  const router = useRouter()
  if (!phase) return null
  if (!phasePageRelationship[phase].includes(router.pathname)) {
    // the pathname is not the expected one, we redirect
    const evaluationId = router.query.evaluationId
    ;(async () => {
      await studentPhaseRedirect(evaluationId, phase, router)
    })()
    return null
  }
  return children
}

export default StudentPhaseRedirect
