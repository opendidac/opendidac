# Migration Status: Function-based Selects to Literal Objects

This document tracks files that still use the deprecated function-based approach for question selects instead of the new literal object approach.

## Migration Overview

The new approach uses const literal objects (e.g., `SELECT_BASE_WITH_PROFESSOR_INFO`, `SELECT_TYPE_SPECIFIC`, `SELECT_QUESTION_TAGS`) instead of runtime functions (e.g., `selectBase()`, `selectTypeSpecific()`, `selectQuestionTags()`).

**Example of new approach:**
```typescript
const SELECT_FOR_PROFESSOR_LISTING = {
  lastUsed: true,
  usageStatus: true,
  evaluation: true,
  ...SELECT_BASE_WITH_PROFESSOR_INFO,
  ...SELECT_TYPE_SPECIFIC,
  ...SELECT_QUESTION_TAGS,
} as const satisfies Prisma.QuestionSelect
```

## Files Still Using Function Approach

### 1. `web/pages/api/users/evaluations/[evaluationId]/join.ts`
**Status:** ✅ **MIGRATED**

**Migration Changes:**
- Replaced function imports with literal object imports: `SELECT_BASE`, `SELECT_TYPE_SPECIFIC`, `SELECT_OFFICIAL_ANSWERS`
- Converted `selectForStudentJoin()` function to `SELECT_FOR_STUDENT_JOIN` const literal
- Updated usage from `selectForStudentJoin()` to `SELECT_FOR_STUDENT_JOIN`

**Previous Functions Used:**
- `selectBase({ includeProfessorOnlyInfo: false })` → `SELECT_BASE`
- `selectTypeSpecific()` → `SELECT_TYPE_SPECIFIC`
- `selectOfficialAnswers()` → `SELECT_OFFICIAL_ANSWERS`

**New Implementation:**
```typescript
const SELECT_FOR_STUDENT_JOIN = {
  ...SELECT_BASE,
  ...SELECT_TYPE_SPECIFIC,
  ...SELECT_OFFICIAL_ANSWERS,
} as const satisfies Prisma.QuestionSelect
```

---

### 2. `web/pages/api/[groupScope]/evaluations/[evaluationId]/composition/index.ts`
**Status:** ✅ **MIGRATED**

**Migration Changes:**
- Replaced function imports with literal object imports: `SELECT_BASE_WITH_PROFESSOR_INFO`, `SELECT_TYPE_SPECIFIC`, `SELECT_QUESTION_TAGS`
- Converted `selectForProfessorListing()` function to `SELECT_FOR_PROFESSOR_LISTING` const literal
- Updated usages from `selectForProfessorListing()` to `SELECT_FOR_PROFESSOR_LISTING` (including spread usage)

**Previous Functions Used:**
- `selectBase({ includeProfessorOnlyInfo: true })` → `SELECT_BASE_WITH_PROFESSOR_INFO`
- `selectQuestionTags()` → `SELECT_QUESTION_TAGS`
- `selectTypeSpecific()` → `SELECT_TYPE_SPECIFIC`

**New Implementation:**
```typescript
const SELECT_FOR_PROFESSOR_LISTING = {
  ...SELECT_BASE_WITH_PROFESSOR_INFO,
  ...SELECT_TYPE_SPECIFIC,
  ...SELECT_QUESTION_TAGS,
} as const satisfies Prisma.QuestionSelect
```

---

### 3. `web/code/evaluation/export/engine/select.ts`
**Status:** ✅ **MIGRATED**

**Migration Changes:**
- Replaced all function imports with literal object imports
- Converted `selectForStudentExport(email)` to use literal objects with dynamic `where` clause for user filtering
- Converted `selectForProfessorExport(includeSubs)` to use literal objects with conditional spreading
- Exported `SELECT_STUDENT_ANSWER_WITH_GRADING` from main index for use in student filtering

**Previous Functions Used:**
- `selectBase({ includeProfessorOnlyInfo: false })` → `SELECT_BASE`
- `selectBase({ includeProfessorOnlyInfo: true })` → `SELECT_BASE_WITH_PROFESSOR_INFO`
- `selectTypeSpecific()` → `SELECT_TYPE_SPECIFIC`
- `selectQuestionTags()` → `SELECT_QUESTION_TAGS`
- `selectOfficialAnswers()` → `SELECT_OFFICIAL_ANSWERS`
- `selectAllStudentAnswers()` → `SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING`
- `selectStudentAnswersForUser(email)` → `SELECT_STUDENT_ANSWER_WITH_GRADING` with `where: { userEmail: email }`
- `selectStudentGradings()` → Already included in `SELECT_STUDENT_ANSWER_WITH_GRADING` and `SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING`

**New Implementation:**
```typescript
export const selectForStudentExport = (email: string): Prisma.QuestionSelect => {
  return {
    ...SELECT_BASE,
    ...SELECT_TYPE_SPECIFIC,
    ...SELECT_QUESTION_TAGS,
    studentAnswer: {
      select: SELECT_STUDENT_ANSWER_WITH_GRADING,
      where: { userEmail: email },
    },
  } as const satisfies Prisma.QuestionSelect
}

export const selectForProfessorExport = (includeSubs: boolean): Prisma.QuestionSelect => {
  const base: Prisma.QuestionSelect = {
    ...SELECT_BASE_WITH_PROFESSOR_INFO,
    ...SELECT_TYPE_SPECIFIC,
    ...SELECT_OFFICIAL_ANSWERS,
    ...SELECT_QUESTION_TAGS,
  } as const satisfies Prisma.QuestionSelect

  return includeSubs
    ? ({ ...base, ...SELECT_ALL_STUDENT_ANSWERS_WITH_GRADING } as const satisfies Prisma.QuestionSelect)
    : base
}
```

**Note:** These functions remain as functions because they take parameters (email, includeSubs), but now use literal objects internally instead of deprecated functions.

---

### 4. `web/code/question/select/investigate.ts`
**Status:** ✅ **MIGRATED** (Investigation/Test File)

**Migration Changes:**
- Replaced function imports with literal object imports
- Converted `selectForProfessorEditing()` function to `SELECT_FOR_PROFESSOR_EDITING` const literal
- Updated console.log to use the literal object directly

**Previous Functions Used:**
- `selectBase({ includeProfessorOnlyInfo: true })` → `SELECT_BASE_WITH_PROFESSOR_INFO`
- `selectQuestionTags()` → `SELECT_QUESTION_TAGS`
- `selectTypeSpecific()` → `SELECT_TYPE_SPECIFIC`
- `selectOfficialAnswers()` → `SELECT_OFFICIAL_ANSWERS`

**New Implementation:**
```typescript
const SELECT_FOR_PROFESSOR_EDITING = {
  ...SELECT_BASE_WITH_PROFESSOR_INFO,
  ...SELECT_TYPE_SPECIFIC,
  ...SELECT_OFFICIAL_ANSWERS,
  ...SELECT_QUESTION_TAGS,
} as const satisfies Prisma.QuestionSelect
```

**Note:** This is a test/investigation file used for testing select combinations. Migration complete - file can be kept for testing purposes or deleted if no longer needed.

---

## Deprecated Functions Reference

The following functions are deprecated and should be replaced with their literal object equivalents:

| Deprecated Function | Literal Object Replacement |
|-------------------|---------------------------|
| `selectBase({ includeProfessorOnlyInfo: true })` | `SELECT_BASE_WITH_PROFESSOR_INFO` |
| `selectBase({ includeProfessorOnlyInfo: false })` | `SELECT_BASE` |
| `selectQuestionTags()` | `SELECT_QUESTION_TAGS` |
| `selectTypeSpecific()` | `SELECT_TYPE_SPECIFIC` |
| `selectOfficialAnswers()` | `SELECT_OFFICIAL_ANSWERS` |
| `selectStudentGradings()` | `SELECT_STUDENT_GRADINGS` |
| `selectAllStudentAnswers()` | `SELECT_ALL_STUDENT_ANSWERS` (literal exists, function doesn't) |
| `selectStudentAnswersForUser(email)` | ❌ **Not implemented** - needs literal object creation |

## Migration Steps

1. Replace function calls with literal object spreads
2. Use `mergeSelects()` when combining multiple selects
3. Use `as const satisfies Prisma.QuestionSelect` for type safety
4. Test thoroughly after migration

## Migration Summary

**Status:** ✅ **ALL FILES MIGRATED**

All 4 files have been successfully migrated from function-based selects to literal object selects:

1. ✅ `web/pages/api/users/evaluations/[evaluationId]/join.ts` - **MIGRATED**
2. ✅ `web/pages/api/[groupScope]/evaluations/[evaluationId]/composition/index.ts` - **MIGRATED**
3. ✅ `web/code/evaluation/export/engine/select.ts` - **MIGRATED**
4. ✅ `web/code/question/select/investigate.ts` - **MIGRATED**

**TypeScript Compilation Status:**
- All deprecated function exports have been removed from `web/code/question/select/index.ts`
- All files now use literal object selects
- No TypeScript errors related to deprecated select functions remain

## Notes

- The `investigate.ts` file may be a temporary test file and could potentially be deleted
- `selectAllStudentAnswers()` and `selectStudentAnswersForUser()` functions don't exist yet - the literal objects (`SELECT_ALL_STUDENT_ANSWERS`) do exist and should be used instead
- For `selectStudentAnswersForUser(email)`, a new literal object pattern may need to be created or the filtering should be done at the query level
- All deprecated function exports have been removed from `web/code/question/select/index.ts` to force migration

