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
import React from 'react'
import QueryEditor from '@/components/question/type_specific/database/QueryEditor'
import QueryOutput from '@/components/question/type_specific/database/QueryOutput'

const ConsultDatabase = ({ queries }) => {
  return queries?.map((answerToQuery, index) => (
    <React.Fragment key={`query-${answerToQuery.query.id}`}>
      <QueryEditor key={index} query={answerToQuery.query} readOnly />
      <QueryOutput
        color={'info'}
        result={answerToQuery.studentOutput?.output}
        lintResult={answerToQuery.query.lintResult}
      />
    </React.Fragment>
  ))
}

export default ConsultDatabase
