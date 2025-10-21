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
import { Stack, Button, Typography } from '@mui/material'

const QuestionNav = ({ evaluationId, page, totalPages }) => {
  const router = useRouter()

  const nextPage = () => {
    if (page < totalPages) {
      router.push(`/users/evaluations/${evaluationId}/take/${page + 1}`)
    }
  }
  const previousPage = () => {
    if (page > 1) {
      router.push(`/users/evaluations/${evaluationId}/take/${page - 1}`)
    }
  }
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ p: 1 }}
    >
      <Button color="primary" disabled={page === 1} onClick={previousPage}>
        Previous
      </Button>
      <Typography variant="body1">
        <b>
          {page} / {totalPages}
        </b>
      </Typography>
      <Button color="primary" disabled={page === totalPages} onClick={nextPage}>
        Next
      </Button>
    </Stack>
  )
}

export default QuestionNav
