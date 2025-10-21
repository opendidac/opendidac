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

import { QuestionType } from '@prisma/client'
import { Stack } from '@mui/material'
import ConsultEssay from './ConsultEssay'
import ConsultWeb from './ConsultWeb'
import ConsultCode from './ConsultCode'
import CompareTrueFalse from './CompareTrueFalse'
import ConsultDatabase from './ConsultDatabase'
import ConsultMultipleChoice from './ConsultMultipleChoice'
import ConsultExactMatch from '@/components/answer/ConsultExactMatch'
/*
    this component is used to display the users answer and grading to a question in the context of the users's consultation
    it displays the answer and grading, but not the solutions
    MultipleChoice:
    In the case of the multiple choice question, it displays all the options and the users's answer
    remember that the users answer only contains options selected by the users (not all options)
    this is why we passe question as a prop to this component, so that we can display all options and check the ones selected by the users
    it is important not to fetch the "isCorrect" property of the option
* */
const AnswerConsult = ({ id, question, answer }) => {
  return (
    <Stack height="100%" overflow="auto">
      {answer &&
        ((question.type === QuestionType.trueFalse && (
          <CompareTrueFalse mode="consult" answer={answer.isTrue} />
        )) ||
          (question.type === QuestionType.multipleChoice && answer.options && (
            <ConsultMultipleChoice
              id={id}
              multipleChoice={question.multipleChoice}
              answer={answer}
            />
          )) ||
          (question.type === QuestionType.essay && (
            <ConsultEssay content={answer.content} />
          )) ||
          (question.type === QuestionType.code && (
            <ConsultCode question={question} answer={answer} />
          )) ||
          (question.type === QuestionType.web && (
            <ConsultWeb answer={answer} />
          )) ||
          (question.type === QuestionType.database && (
            <ConsultDatabase queries={answer.queries} />
          )) ||
          (question.type === QuestionType.exactMatch && (
            <ConsultExactMatch
              exactMatch={question.exactMatch}
              answer={answer}
            />
          )))}
    </Stack>
  )
}

export default AnswerConsult
