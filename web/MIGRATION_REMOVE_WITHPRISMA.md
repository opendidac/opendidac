# Migration: Remove withPrisma Middleware

## Objective

The `withPrisma` middleware is now redundant since Prisma is automatically included in the API context via `withApiContext`. This migration aims to remove all `withPrisma` middleware wrappers from API endpoints, as the Prisma client is now available directly in the context object (`ctx.prisma`).

## Migration Steps

For each endpoint:
1. Remove `withPrisma()` wrapper from the handler
2. Ensure the handler uses `ctx.prisma` instead of accessing Prisma through the middleware
3. Test the endpoint to verify it still works correctly

## Checklist

| Done | Endpoint |
|------|----------|
| ☑ | `/api/[groupScope]/evaluations` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/attendance` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/attendance/denied` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/composition` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/composition/[questionId]` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/composition/order` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/consult/[userEmail]` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/export` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/phase` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/progress` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/questions` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/questions/[questionId]` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/results` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/students/[studentEmail]/status` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/students/allow` |
| ☑ | `/api/[groupScope]/evaluations/[evaluationId]/students/denied` |
| ☑ | `/api/[groupScope]/gradings` |
| ☑ | `/api/[groupScope]/gradings/annotations` |
| ☑ | `/api/[groupScope]/gradings/annotations/[annotationId]` |
| ☑ | `/api/[groupScope]/questions` |
| ☑ | `/api/[groupScope]/questions/[questionId]` |
| ☑ | `/api/[groupScope]/questions/[questionId]/archive` |
| ☑ | `/api/[groupScope]/questions/[questionId]/code` |
| ☑ | `/api/[groupScope]/questions/[questionId]/code/code-reading` |
| ☑ | `/api/[groupScope]/questions/[questionId]/code/code-reading/snippets` |
| ☑ | `/api/[groupScope]/questions/[questionId]/code/code-reading/snippets/[snippetId]` |
| ☑ | `/api/[groupScope]/questions/[questionId]/code/code-writing` |
| ☑ | `/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]` |
| ☑ | `/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]/[fileId]` |
| ☑ | `/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]/pull` |
| ☑ | `/api/[groupScope]/questions/[questionId]/code/code-writing/tests` |
| ☑ | `/api/[groupScope]/questions/[questionId]/code/code-writing/tests/[index]` |
| ☑ | `/api/[groupScope]/questions/[questionId]/code/sandbox` |
| ☑ | `/api/[groupScope]/questions/[questionId]/copy` |
| ☑ | `/api/[groupScope]/questions/[questionId]/database` |
| ☑ | `/api/[groupScope]/questions/[questionId]/database/queries` |
| ☑ | `/api/[groupScope]/questions/[questionId]/database/queries/[queryId]` |
| ☑ | `/api/[groupScope]/questions/[questionId]/exact-match/fields` |
| ☑ | `/api/[groupScope]/questions/[questionId]/exact-match/order` |
| ☑ | `/api/[groupScope]/questions/[questionId]/multiple-choice` |
| ☑ | `/api/[groupScope]/questions/[questionId]/multiple-choice/grading-policy/gradual-credit` |
| ☑ | `/api/[groupScope]/questions/[questionId]/multiple-choice/options` |
| ☑ | `/api/[groupScope]/questions/[questionId]/multiple-choice/options/[optionId]` |
| ☑ | `/api/[groupScope]/questions/[questionId]/multiple-choice/order` |
| ☑ | `/api/[groupScope]/questions/[questionId]/tags` |
| ☑ | `/api/[groupScope]/questions/[questionId]/unarchive` |
| ☑ | `/api/[groupScope]/questions/export` |
| ☑ | `/api/[groupScope]/questions/import` |
| ☑ | `/api/[groupScope]/questions/tags` |
| ☑ | `/api/[groupScope]/upload` |
| ☑ | `/api/admin/archive` |
| ☑ | `/api/admin/archive/[evaluationId]/archive` |
| ☑ | `/api/admin/archive/[evaluationId]/archive-immediately` |
| ☑ | `/api/admin/archive/[evaluationId]/back-to-active` |
| ☑ | `/api/admin/archive/[evaluationId]/mark-for-archival` |
| ☑ | `/api/admin/archive/[evaluationId]/purge-data` |
| ☑ | `/api/admin/archive/[evaluationId]/purge-without-archive` |
| ☑ | `/api/admin/statistics/[academicYear]` |
| ☑ | `/api/admin/statistics/years` |
| ☑ | `/api/assets/[...path]` |
| ☑ | `/api/auth/[...nextauth]` |
| ☑ | `/api/conn_check` |
| ☑ | `/api/groups` |
| ☑ | `/api/groups/[groupId]` |
| ☑ | `/api/groups/[groupId]/members` |
| ☑ | `/api/groups/check` |
| ☑ | `/api/maintenance` |
| ☑ | `/api/sandbox/[questionId]/code-reading` |
| ☑ | `/api/sandbox/[questionId]/code-writing/[nature]` |
| ☑ | `/api/sandbox/[questionId]/database` |
| ☑ | `/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/code/code-writing` |
| ☑ | `/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/database` |
| ☑ | `/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/database/console` |
| ☑ | `/api/sandbox/image/pull` |
| ☑ | `/api/session-sse` |
| ☑ | `/api/terms` |
| ☑ | `/api/users` |
| ☑ | `/api/users/[userId]` |
| ☑ | `/api/users/evaluations/[evaluationId]/consult` |
| ☑ | `/api/users/evaluations/[evaluationId]/dispatch` |
| ☑ | `/api/users/evaluations/[evaluationId]/export` |
| ☑ | `/api/users/evaluations/[evaluationId]/join` |
| ☑ | `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers` |
| ☑ | `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-reading/[snippetId]` |
| ☑ | `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-reading/check` |
| ☑ | `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-writing/[fileId]` |
| ☑ | `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/database/[queryId]` |
| ☑ | `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/exact-match/fields` |
| ☑ | `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/multi-choice` |
| ☑ | `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/multi-choice/options` |
| ☑ | `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/submit` |
| ☑ | `/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/utils` |
| ☑ | `/api/users/evaluations/[evaluationId]/status` |
| ☑ | `/api/users/evaluations/[evaluationId]/take` |
| ☑ | `/api/users/groups` |
| ☑ | `/api/users/groups/select` |
| ☑ | `/api/whoami` |

## Notes

- Some endpoints may not use `withPrisma` (e.g., static assets, auth endpoints). Verify before migrating.
- After removing `withPrisma`, ensure all handlers access Prisma via `ctx.prisma`.
- Test each endpoint after migration to ensure functionality is preserved.

