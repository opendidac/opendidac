# Migration: Remove Direct `getUser()` Calls

## Objective

Migrate all API endpoints from direct `getUser()` calls to using `ctx.user` from the base context. The user is now automatically included in `ApiContext` by `withApiContext` middleware.

**Benefits:**

- **Consistency**: User is always available in context (null if not authenticated)
- **Type Safety**: TypeScript support for user in context
- **Code Quality**: Removes repetitive `getUser` calls and imports
- **Performance**: User is fetched once at entry point, not per handler

## Migration Pattern

### Before:

```javascript
import { getUser } from '@/code/auth/auth'

const handler = async (ctx) => {
  const { req, res } = ctx
  const user = await getUser(req, res)
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }
  // Use user...
}
```

### After:

```javascript
const handler = async (ctx) => {
  const { user } = ctx // User is available (null if not authenticated)
  if (!user) {
    ctx.res.status(401).json({ message: 'Unauthorized' })
    return
  }
  // Use user...
}
```

**Note**: User is automatically fetched by `withApiContext` and available as `ctx.user` (null if not authenticated).

## Progress

### ✅ Completed (2/32)

- [x] `web/pages/api/users/groups/index.js` - Removed `getUser` call, uses `ctx.user`
- [x] `web/pages/api/admin/archive/[evaluationId]/archive-immediately.js` - Removed `getUser` call, uses `ctx.user`

### 🔄 In Progress

- None

### ⏳ Remaining (30/32)

#### User Endpoints (`/api/users/*`)

- [ ] `web/pages/api/users/index.js` - Uses `getUser` for super admin check
- [ ] `web/pages/api/users/groups/select.js` - Uses `getUser` to get user groups
- [ ] `web/pages/api/users/evaluations/[evaluationId]/take.js` - Uses `getUser` to get user email
- [ ] `web/pages/api/users/evaluations/[evaluationId]/status.js` - Uses `getUser` in GET and PUT handlers
- [ ] `web/pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/submit.js` - Uses `getUser` in POST and PUT handlers
- [ ] `web/pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/multi-choice/index.js` - Uses `getUser` in PUT handler
- [ ] `web/pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/multi-choice/options.js` - Uses `getUser` in PUT handler
- [ ] `web/pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/index.js` - Uses `getUser` in GET and PUT handlers
- [ ] `web/pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/database/[queryId].js` - Uses `getUser` in PUT handler
- [ ] `web/pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/exact-match/fields.js` - Uses `getUser` in PUT handler
- [ ] `web/pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-writing/[fileId].js` - Uses `getUser` in PUT handler
- [ ] `web/pages/api/users/evaluations/[evaluationId]/join.js` - Uses `getUser` to get user email
- [ ] `web/pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-reading/[snippetId].js` - Uses `getUser` in PUT handler
- [ ] `web/pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-reading/check.js` - Uses `getUser` in POST handler
- [ ] `web/pages/api/users/evaluations/[evaluationId]/dispatch.js` - Uses `getUser` to get user
- [ ] `web/pages/api/users/evaluations/[evaluationId]/consult.js` - Uses `getUser` to get email
- [ ] `web/pages/api/users/evaluations/[evaluationId]/export.js` - Uses `getUser` to get current user email

#### Sandbox Endpoints (`/api/sandbox/*`)

- [ ] `web/pages/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/database/index.js` - Uses `getUser` in POST handler
- [ ] `web/pages/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/database/console.js` - Uses `getUser` in POST handler
- [ ] `web/pages/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/code/code-writing.js` - Uses `getUser` in POST handler

#### Groups Endpoints (`/api/groups/*`)

- [ ] `web/pages/api/groups/index.js` - Uses `getUser` in GET and POST handlers
- [ ] `web/pages/api/groups/[groupId]/index.js` - Uses `getUser` in DELETE and PATCH handlers
- [ ] `web/pages/api/groups/[groupId]/members/index.js` - Uses `getUser` in GET, POST, and DELETE handlers (3 occurrences)

#### Admin Archive Endpoints (`/api/admin/archive/*`)

- [ ] `web/pages/api/admin/archive/[evaluationId]/purge-without-archive.js` - Uses `getUser` to get user performing action
- [ ] `web/pages/api/admin/archive/[evaluationId]/mark-for-archival.js` - Uses `getUser` to get user performing action
- [ ] `web/pages/api/admin/archive/[evaluationId]/purge-data.js` - Uses `getUser` to get user performing action
- [ ] `web/pages/api/admin/archive/[evaluationId]/archive.js` - Uses `getUser` to get user performing archival
- [ ] `web/pages/api/admin/archive/[evaluationId]/back-to-active.js` - Uses `getUser` to get user performing action

#### Group-Scoped Endpoints (`/api/[groupScope]/*`)

- [ ] `web/pages/api/[groupScope]/evaluations/index.js` - Uses `getUser` to record creator
- [ ] `web/pages/api/[groupScope]/gradings/annotations/[annotationId].js` - Uses `getUser` in PATCH handler
- [ ] `web/pages/api/[groupScope]/gradings/annotations/index.js` - Uses `getUser` in POST handler

#### System Endpoints

- [ ] `web/pages/api/session-sse.js` - Uses `getUser` for authentication check

## Notes

### Special Cases

1. **Endpoints with conditional auth**: Some endpoints (like `users/index.js`) only check user for certain conditions. These may need special handling or can use `withUser` with conditional logic.

2. **Endpoints already using `withAuthorization`**: Some endpoints already use `withAuthorization` which calls `getRoles`. These can be updated to use `withUser` instead if they need the full user object.

3. **Endpoints using `req_raw`/`res_raw`**: The `withUser` middleware uses `req_raw`/`res_raw` internally, so endpoints that need raw Next.js objects will work correctly.

### Migration Steps for Each Endpoint

1. Remove `getUser` import: `import { getUser } from '@/code/auth/auth'`
2. Remove `getUser()` call: `const user = await getUser(req, res)`
3. Extract `user` from context: `const { user } = ctx`
4. Add null check if needed: `if (!user) { res.status(401).json(...); return }`
5. Remove `withUser` from middleware chain (if present)
6. Test the endpoint

### Testing Checklist

After migrating each endpoint:

- [ ] Verify endpoint works with authenticated user
- [ ] Verify endpoint returns 401 for unauthenticated requests
- [ ] Verify all user properties are accessible (email, id, roles, etc.)
- [ ] Check middleware order is correct (withUser should come before handlers that need user)

## Statistics

- **Total endpoints**: 32
- **Completed**: 2 (6%)
- **Remaining**: 30 (94%)
