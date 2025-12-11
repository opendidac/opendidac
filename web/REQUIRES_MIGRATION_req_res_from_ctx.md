# Files Requiring Migration: `const { req, res` Pattern

This document lists all occurrences of the pattern `const { req, res` where `req` and `res` are being destructured from `ctx`. These files need to be updated to use the new middleware signature where `req` and `res` are passed as separate parameters instead of being part of the context object.

**Total occurrences: 130**

## Migration Pattern

**Before:**
```typescript
const handler = async (ctx: IApiContext) => {
  const { req, res, prisma } = ctx
  // ...
}
```

**After:**
```typescript
const handler = async (req: NextApiRequest, res: NextApiResponse, ctx: IApiContext) => {
  const { prisma } = ctx
  // ...
}
```

---

## Migration Checklist

### `/pages/api/users/`

- [x] **`pages/api/users/index.js`** - Line 28
- [x] **`pages/api/users/[userId].js`** - Line 26

### `/pages/api/users/evaluations/[evaluationId]/`

- [x] **`pages/api/users/evaluations/[evaluationId]/take.js`** - Line 43
- [x] **`pages/api/users/evaluations/[evaluationId]/status.js`** - Lines 82, 136 (2 handlers)
- [x] **`pages/api/users/evaluations/[evaluationId]/join.ts`** - Line 51
- [x] **`pages/api/users/evaluations/[evaluationId]/export.ts`** - Line 51
- [x] **`pages/api/users/evaluations/[evaluationId]/dispatch.js`** - Line 33
- [x] **`pages/api/users/evaluations/[evaluationId]/consult.ts`** - Line 74

### `/pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/`

- [x] **`pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/submit.js`** - Lines 39, 61 (2 handlers)
- [x] **`pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/index.js`** - Lines 47, 261 (2 handlers)
- [x] **`pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/multi-choice/options.js`** - Line 34
- [x] **`pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/multi-choice/index.js`** - Line 29
- [x] **`pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/exact-match/fields.js`** - Line 33
- [x] **`pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/database/[queryId].js`** - Line 38
- [x] **`pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-writing/[fileId].js`** - Line 36
- [x] **`pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-reading/check.js`** - Line 35
- [x] **`pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/code/code-reading/[snippetId].js`** - Line 37

### `/pages/api/users/groups/`

- [x] **`pages/api/users/groups/index.js`** - Line 21
- [x] **`pages/api/users/groups/select.js`** - Line 22

### `/pages/api/groups/`

- [x] **`pages/api/groups/index.ts`** - Lines 74, 131 (2 handlers)
- [x] **`pages/api/groups/check.js`** - Line 29

### `/pages/api/groups/[groupId]/`

- [x] **`pages/api/groups/[groupId]/index.js`** - Lines 28, 59 (2 handlers)
- [x] **`pages/api/groups/[groupId]/members/index.js`** - Lines 30, 77, 130 (3 handlers)

### `/pages/api/[groupScope]/questions/`

- [x] **`pages/api/[groupScope]/questions/tags.js`** - Line 44
- [x] **`pages/api/[groupScope]/questions/import.js`** - Line 26
- [x] **`pages/api/[groupScope]/questions/export.js`** - Line 26

### `/pages/api/[groupScope]/questions/[questionId]/`

- [x] **`pages/api/[groupScope]/questions/[questionId]/index.ts`** - Lines 54, 99, 167 (3 handlers)
- [x] **`pages/api/[groupScope]/questions/[questionId]/copy.ts`** - Line 29
- [x] **`pages/api/[groupScope]/questions/[questionId]/unarchive.js`** - Line 25
- [x] **`pages/api/[groupScope]/questions/[questionId]/tags.js`** - Lines 32, 48 (2 handlers)
- [x] **`pages/api/[groupScope]/questions/[questionId]/archive.js`** - Line 25

### `/pages/api/[groupScope]/questions/[questionId]/multiple-choice/`

- [x] **`pages/api/[groupScope]/questions/[questionId]/multiple-choice/order.js`** - Line 28
- [x] **`pages/api/[groupScope]/questions/[questionId]/multiple-choice/index.js`** - Lines 33, 59 (2 handlers)
- [x] **`pages/api/[groupScope]/questions/[questionId]/multiple-choice/options.js`** - Line 33
- [x] **`pages/api/[groupScope]/questions/[questionId]/multiple-choice/options/[optionId].js`** - Lines 28, 75 (2 handlers)
- [x] **`pages/api/[groupScope]/questions/[questionId]/multiple-choice/grading-policy/gradual-credit.js`** - Lines 33, 48, 67 (3 handlers)

### `/pages/api/[groupScope]/questions/[questionId]/exact-match/`

- [x] **`pages/api/[groupScope]/questions/[questionId]/exact-match/order.js`** - Line 26
- [x] **`pages/api/[groupScope]/questions/[questionId]/exact-match/fields.js`** - Lines 26, 54, 75, 122 (4 handlers)

### `/pages/api/[groupScope]/questions/[questionId]/database/`

- [x] **`pages/api/[groupScope]/questions/[questionId]/database/index.js`** - Lines 35, 48 (2 handlers)
- [x] **`pages/api/[groupScope]/questions/[questionId]/database/queries/index.js`** - Lines 26, 58 (2 handlers)
- [x] **`pages/api/[groupScope]/questions/[questionId]/database/queries/[queryId].js`** - Lines 32, 97 (2 handlers)

### `/pages/api/[groupScope]/questions/[questionId]/code/`

- [x] **`pages/api/[groupScope]/questions/[questionId]/code/index.js`** - Line 25
- [x] **`pages/api/[groupScope]/questions/[questionId]/code/sandbox/index.js`** - Lines 36, 49, 69 (3 handlers)

### `/pages/api/[groupScope]/questions/[questionId]/code/code-writing/`

- [x] **`pages/api/[groupScope]/questions/[questionId]/code/code-writing/index.js`** - Lines 25, 34 (2 handlers)
- [x] **`pages/api/[groupScope]/questions/[questionId]/code/code-writing/tests/index.js`** - Lines 32, 48 (2 handlers)
- [x] **`pages/api/[groupScope]/questions/[questionId]/code/code-writing/tests/[index].js`** - Lines 33, 54 (2 handlers)
- [x] **`pages/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]/pull.js`** - Line 33
- [x] **`pages/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]/index.js`** - Lines 33, 57 (2 handlers)
- [x] **`pages/api/[groupScope]/questions/[questionId]/code/code-writing/files/[nature]/[fileId].js`** - Lines 26, 81 (2 handlers)

### `/pages/api/[groupScope]/questions/[questionId]/code/code-reading/`

- [x] **`pages/api/[groupScope]/questions/[questionId]/code/code-reading/index.js`** - Lines 34, 49 (2 handlers)
- [x] **`pages/api/[groupScope]/questions/[questionId]/code/code-reading/snippets.js`** - Lines 33, 49 (2 handlers)
- [x] **`pages/api/[groupScope]/questions/[questionId]/code/code-reading/snippets/[snippetId].js`** - Lines 26, 65 (2 handlers)

### `/pages/api/[groupScope]/evaluations/`

- [x] **`pages/api/[groupScope]/evaluations/index.js`** - Lines 32, 82 (2 handlers)

### `/pages/api/[groupScope]/evaluations/[evaluationId]/`

- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/index.js`** - Lines 30, 61, 277 (3 handlers)
- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/results/index.ts`** - Line 49
- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/questions/index.ts`** - Line 57
- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/questions/[questionId].js`** - Line 25
- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/progress/index.ts`** - Lines 53, 91 (2 handlers)
- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/phase.ts`** - Lines 92, 120 (2 handlers)
- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/export.ts`** - Line 49
- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/students/allow.js`** - Line 35
- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/students/denied.js`** - Line 29
- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/students/[studentEmail]/status.js`** - Line 27
- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/attendance/index.js`** - Line 25
- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/attendance/denied.js`** - Line 29
- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/consult/[userEmail].ts`** - Line 62

### `/pages/api/[groupScope]/evaluations/[evaluationId]/composition/`

- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/composition/index.ts`** - Lines 47, 90 (2 handlers)
- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/composition/order.js`** - Line 28
- [x] **`pages/api/[groupScope]/evaluations/[evaluationId]/composition/[questionId].js`** - Lines 27, 62 (2 handlers)

### `/pages/api/[groupScope]/gradings/`

- [x] **`pages/api/[groupScope]/gradings/index.js`** - Line 30

### `/pages/api/[groupScope]/gradings/annotations/`

- [x] **`pages/api/[groupScope]/gradings/annotations/index.js`** - Lines 59, 75 (2 handlers)
- [x] **`pages/api/[groupScope]/gradings/annotations/[annotationId].js`** - Lines 59, 84 (2 handlers)

### `/pages/api/[groupScope]/upload/`

- [x] **`pages/api/[groupScope]/upload/index.js`** - Line 96

### `/pages/api/admin/archive/`

- [x] **`pages/api/admin/archive/index.js`** - Line 28

### `/pages/api/admin/archive/[evaluationId]/`

- [x] **`pages/api/admin/archive/[evaluationId]/purge-without-archive.js`** - Line 25
- [x] **`pages/api/admin/archive/[evaluationId]/purge-data.js`** - Line 25
- [x] **`pages/api/admin/archive/[evaluationId]/mark-for-archival.js`** - Line 24
- [x] **`pages/api/admin/archive/[evaluationId]/back-to-active.js`** - Line 24
- [x] **`pages/api/admin/archive/[evaluationId]/archive.js`** - Line 24
- [x] **`pages/api/admin/archive/[evaluationId]/archive-immediately.js`** - Line 23

### `/pages/api/admin/statistics/`

- [x] **`pages/api/admin/statistics/years.js`** - Line 22
- [x] **`pages/api/admin/statistics/[academicYear].js`** - Line 25

### `/pages/api/sandbox/`

- [x] **`pages/api/sandbox/image/pull.js`** - Line 24
- [x] **`pages/api/sandbox/[questionId]/database.js`** - Line 28
- [x] **`pages/api/sandbox/[questionId]/code-writing/[nature].js`** - Line 27
- [x] **`pages/api/sandbox/[questionId]/code-reading/index.js`** - Line 30

### `/pages/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/`

- [x] **`pages/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/database/index.js`** - Line 82
- [x] **`pages/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/database/console.js`** - Line 28
- [x] **`pages/api/sandbox/evaluations/[evaluationId]/questions/[questionId]/student/code/code-writing.js`** - Line 33

### `/pages/api/assets/`

- [x] **`pages/api/assets/[...path].js`** - Line 31

### `/pages/api/maintenance.js`

- [x] **`pages/api/maintenance.js`** - Line 172

### Documentation Files

- [ ] **`MIGRATION_WITHUSER.md`** - Line 22 (documentation/example, may not need migration)

---

## Migration Steps

For each file, ensure:

1. ✅ Update handler signature from `async (ctx)` to `async (req, res, ctx)`
2. ✅ Remove `req` and `res` from destructuring: `const { req, res, ... } = ctx` → `const { ... } = ctx`
3. ✅ Update all middleware wrappers in the export statement to pass through `req, res, ctx`
4. ✅ Add `NextApiRequest` and `NextApiResponse` imports if not already present
5. ✅ Test the endpoint to ensure it still works correctly

---

## Notes

- Some files may have multiple handlers (GET, POST, PUT, DELETE, etc.) - each needs to be updated
- Files ending in `.ts` should have proper TypeScript types
- Files ending in `.js` may need type annotations added during migration
- The `MIGRATION_WITHUSER.md` file contains documentation/example code and may not need actual migration
