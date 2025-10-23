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

import { QuestionType, CodeQuestionType } from '@prisma/client'
import React, { useEffect, useMemo, useState } from 'react'
import DialogFeedback from '@/components/feedback/DialogFeedback'
import {
  Stack,
  Typography,
  MenuItem,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import { toArray as typesToArray } from '@/components/question/types'
import AlertFeedback from '@/components/feedback/AlertFeedback'
import QuestionTypeIcon from '@/components/question/QuestionTypeIcon'
import LanguageSelector from '@/components/question/type_specific/code/LanguageSelector'
import TypeSelector from '@/components/question/TypeSelector'

import languages from '@/code/languages.json'
import DropDown from '@/components/input/DropDown'
import CodeQuestionTypeIcon from '@/components/question/type_specific/code/CodeQuestionTypeIcon'
import QuestionTagsViewer from '@/components/question/tags/QuestionTagsViewer'
import PushPinIcon from '@mui/icons-material/PushPin'

const types = typesToArray()

const defaultLanguage = languages.environments[0].language

const listOfCodeQuestionTypes = Object.keys(CodeQuestionType).map((key) => ({
  value: key,
}))

const AddQuestionDialog = ({
  inheritedTags,
  open,
  onClose,
  handleAddQuestion,
}) => {
  const [type, setType] = useState(types[0].value)
  const [language, setLanguage] = useState(defaultLanguage)
  const [codeQuestionType, setCodeQuestionType] = useState(
    CodeQuestionType.codeWriting,
  )
  const [codeWritingTemplate, setCodeWritingTemplate] = useState('basic')

  const tagsForViewer = useMemo(
    () =>
      inheritedTags.map((t) => {
        return { label: t }
      }),
    [inheritedTags],
  )
  const [includeInheritedTags, setIncludeInheritedTags] = useState(true)
  useEffect(() => {
    if (open) {
      setIncludeInheritedTags(true)
    }
  }, [open])

  useEffect(() => {
    setCodeWritingTemplate('basic')
  }, [language])

  return (
    <DialogFeedback
      open={open}
      onClose={onClose}
      title={`Create new question`}
      content={
        <Stack spacing={2} width={'500px'}>
          {tagsForViewer.length > 0 && (
            <Card
              elevation={0}
              sx={{ border: 1, borderColor: 'info.main', borderRadius: 2 }}
            >
              <CardContent>
                <Stack spacing={1} alignItems="flex-start">
                  <Typography
                    variant="title"
                    display="flex"
                    alignItems="center"
                  >
                    <PushPinIcon color="info" sx={{ mr: 1 }} />
                    Pinned tags
                  </Typography>
                  <Typography variant="body2">
                    The following tags are part of the currently pinned search,
                    and may be added to the newly created question.
                  </Typography>
                  <Stack sx={{ p: 1, pl: 0 }}>
                    <QuestionTagsViewer
                      size="small"
                      tags={tagsForViewer}
                      disabled={!includeInheritedTags}
                    />
                  </Stack>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeInheritedTags}
                        onChange={(e) =>
                          setIncludeInheritedTags(e.target.checked)
                        }
                        color="info"
                        size="small"
                      />
                    }
                    label="Include pinned tags in the new question"
                  />
                </Stack>
              </CardContent>
            </Card>
          )}
          <Typography variant="body1">
            Select the type of question you want to create
          </Typography>
          <Stack
            spacing={1}
            width={'100%'}
            direction={'row'}
            alignItems={'center'}
          >
            <TypeSelector type={type} onChange={setType} />
            <QuestionTypeIcon type={type} size={50} />
          </Stack>
          <AlertFeedback severity="warning">
            <Typography variant="body1">
              You cannot change the type after the question has been created.
            </Typography>
          </AlertFeedback>
          {type === QuestionType.code && (
            <>
              <Typography variant="body1">
                Select the language and type of the code question
              </Typography>
              <Stack direction="row" spacing={2}>
                <LanguageSelector language={language} onChange={setLanguage} />
                <CodeQuestionTypeSelector
                  options={listOfCodeQuestionTypes}
                  codeQuestionType={codeQuestionType}
                  setCodeQuestionType={setCodeQuestionType}
                />
              </Stack>
              {codeQuestionType === CodeQuestionType.codeWriting && (
                <CodeWritingStartingTemplate
                  language={language}
                  codeWritingTemplate={codeWritingTemplate}
                  setCodeWritingTemplate={setCodeWritingTemplate}
                />
              )}
            </>
          )}
        </Stack>
      }
      onConfirm={() =>
        handleAddQuestion(type, {
          language,
          codeQuestionType,
          codeWritingTemplate,
          tags: includeInheritedTags ? (inheritedTags ?? []) : [],
        })
      }
    />
  )
}
const CodeQuestionTypeSelector = ({
  options,
  codeQuestionType,
  setCodeQuestionType,
}) => {
  const helperText =
    codeQuestionType === CodeQuestionType.codeReading
      ? 'Understand the code and guess the output'
      : 'Write the code and pass codecheck'
  return (
    <DropDown
      id="codeQuestionType"
      name="Code Question Type"
      defaultValue={codeQuestionType}
      minWidth="150px"
      onChange={setCodeQuestionType}
      helperText={helperText}
    >
      {options.map((type, i) => (
        <MenuItem key={i} value={type.value}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CodeQuestionTypeIcon size={20} codeType={type.value} withLabel />
          </Stack>
        </MenuItem>
      ))}
    </DropDown>
  )
}

const CodeWritingStartingTemplate = ({
  language,
  codeWritingTemplate,
  setCodeWritingTemplate,
}) => {
  const template = languages.environments
    .find((env) => env.language === language)
    .codeWriting.find((cw) => cw.value === codeWritingTemplate)

  return (
    template && (
      <>
        <DropDown
          id="template"
          name="Starter Template"
          defaultValue={codeWritingTemplate}
          minWidth="140px"
          onChange={setCodeWritingTemplate}
        >
          {languages.environments
            .find((env) => env.language === language)
            .codeWriting.map((template, i) => (
              <MenuItem key={i} value={template.value}>
                {template.label}
              </MenuItem>
            ))}
        </DropDown>
        <AlertFeedback severity="info">
          <Typography variant="body1">{template.description}</Typography>
        </AlertFeedback>
      </>
    )
  )
}

export default AddQuestionDialog
