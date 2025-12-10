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

import { Role, QuestionType, CodeQuestionType, Prisma } from "@prisma/client";
import { withAuthorization, withGroupScope } from "@/middleware/withAuthorization";
import { withApiContext } from "@/middleware/withApiContext";
import type { ApiHandler, IApiContext } from "@/core/types/api";

import { questionsFilterWhereClause } from "@/core/questionsFilter";
import { codeInitialUpdateQuery, questionTypeSpecific } from "@/core/questions";

import languages from "@/core/languages.json";
import databaseTemplate from "@/core/database.json";

// ---------- IMPORT VIEW SELECTS + PAYLOAD TYPES ----------
import {
  SELECT_FOR_PROFESSOR_LISTING,
  SELECT_FOR_PROFESSOR_EDITING,
  type ProfessorListingPayload,
  type ProfessorEditingPayload,
} from "@/api-types/[groupScope]/questions/index";


// ----------------------------------------------------------
// GET /api/[groupScope]/questions
// ----------------------------------------------------------

const get: ApiHandler<ProfessorListingPayload[]> = async (ctx: IApiContext) => {
  const { req, prisma } = ctx;

  const where = questionsFilterWhereClause(req.query);

  const questions = await prisma.question.findMany({
    ...where,
    select: SELECT_FOR_PROFESSOR_LISTING,
    orderBy: { createdAt: "desc" },
  });

  return { status: 200, data: questions };
};


// ----------------------------------------------------------
// POST /api/[groupScope]/questions
// ----------------------------------------------------------

const post: ApiHandler<ProfessorEditingPayload> = async (ctx: IApiContext) => {
  const { req, prisma } = ctx;
  const { groupScope } = req.query;

  // NO PostQuestionBody TYPE — WE JUST USE req.body DIRECTLY
  const body = req.body ?? {};
  const type = body.type as string | undefined;

  const options = (body.options ?? {}) as {
    language?: string;
    codeQuestionType?: CodeQuestionType;
    codeWritingTemplate?: string;
    tags?: string[];
  };

  if (!type) return { status: 400, message: "Invalid question type" };

  const questionType = QuestionType[type as keyof typeof QuestionType];
  if (!questionType) return { status: 400, message: "Invalid question type" };

  if (!groupScope || typeof groupScope !== "string")
    return { status: 400, message: "Missing groupScope" };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({
        where: { scope: groupScope },
        select: { id: true },
      });

      if (!group) throw new Error("Group not found: " + groupScope);

      const created = await tx.question.create({
        data: {
          type: questionType,
          title: "",
          content: "",
          [questionType]: {
            create: questionTypeSpecific(questionType, null),
          },
          group: { connect: { scope: groupScope } },
        },
        select: { id: true },
      });

      switch (questionType) {
        case QuestionType.code: {
          const def = defaultCodeBasedOnLanguageAndType(
            options.language,
            options.codeQuestionType,
            options
          );

          await tx.code.update(
            codeInitialUpdateQuery(created.id, def, options.codeQuestionType)
          );
          break;
        }

        case QuestionType.database: {
          await tx.database.update({
            where: { questionId: created.id },
            data: {
              image: databaseTemplate.image,
              databaseQueries: {
                create: databaseTemplate.queries.map((q) => ({
                  order: q.order,
                  title: q.title,
                  description: q.description,
                  content: q.content,
                  lintActive: q.lintActive,
                  testQuery: q.testQuery,
                  studentPermission: q.studentPermission,
                  databaseToSolutionQuery: {
                    create: { database: { connect: { questionId: created.id } } },
                  },
                })),
              },
            },
          });
          break;
        }
      }

      if (options.tags?.length) {
        await Promise.all(
          options.tags.map((label) =>
            tx.questionToTag.create({
              data: { questionId: created.id, groupId: group.id, label },
            })
          )
        );
      }

      return tx.question.findUnique({
        where: { id: created.id },
        select: SELECT_FOR_PROFESSOR_EDITING,
      });
    });

    return { status: 200, data: result as ProfessorEditingPayload };
  } catch (err) {
    console.error("POST /question error:", err);
    return { status: 500, message: "Failed to create question" };
  }
};


// ----------------------------------------------------------

export default withApiContext({
  GET: withGroupScope(withAuthorization(get, { roles: [Role.PROFESSOR] })),
  POST: withGroupScope(withAuthorization(post, { roles: [Role.PROFESSOR] })),
});


// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

function defaultCodeBasedOnLanguageAndType(
  language: string | undefined,
  codeQuestionType: CodeQuestionType | undefined,
  options: {
    language?: string;
    codeQuestionType?: CodeQuestionType;
    codeWritingTemplate?: string;
    tags?: string[];
  }
) {
  if (!language) throw new Error("Language is required");

  const env = languages.environments.find((e) => e.language === language);
  if (!env) throw new Error("Environment not found: " + language);
  if (!env.sandbox.beforeAll) throw new Error("sandbox.beforeAll is required for language: " + language);

  const base = {
    language: env.language,
    sandbox: {
      image: env.sandbox.image,
      beforeAll: env.sandbox.beforeAll,
    },
  };

  if (codeQuestionType === CodeQuestionType.codeWriting) {
    const tpl = env.codeWriting.find((cw) => cw.value === options.codeWritingTemplate)
      ?.setup;
    if (!tpl) throw new Error("Invalid codeWriting template");

    return {
      ...base,
      sandbox: {
        image: base.sandbox.image,
        beforeAll: base.sandbox.beforeAll,
      },
      files: tpl.files,
      testCases: tpl.testCases,
    };
  }

  if (codeQuestionType === CodeQuestionType.codeReading) {
    return {
      ...base,
      contextExec: env.sandbox.exec,
      contextPath: env.sandbox.defaultPath,
      context: env.codeReading.context,
      snippets: env.codeReading.snippets,
    };
  }

  return base;
}
