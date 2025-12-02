# Types Directory

This directory contains TypeScript type definitions organized by domain.

## Structure

```
types/
├── api/                    # API-related types (backend/API routes)
│   ├── context.ts         # API context types (ApiContext, extended contexts)
│   └── index.ts           # Re-exports for api types
├── frontend/              # Frontend types (will be added later)
│   └── ...                # Component props, hooks, etc.
├── index.ts               # Main re-export (import from '@/types')
└── README.md              # This file
```

## Usage

### Importing Types

```typescript
// Import API types (recommended for API routes)
import type { ApiContext, ApiContextWithRoles } from '@/types/api'

// Import frontend types (when added)
import type { ComponentProps } from '@/types/frontend'

// Or import from main index (exports all types)
import type { ApiContext } from '@/types'
```

### Available Types

#### `ApiContext`

Base context provided by `withApiContext` middleware. Available to all API handlers.

```typescript
interface ApiContext {
  req: NextApiRequest
  res: NextApiResponse
  prisma: PrismaClient
}
```

#### `ApiContextWithRoles`

Extended context with user roles. Added by `withAuthorization` middleware.

```typescript
interface ApiContextWithRoles extends ApiContext {
  roles: Role[]
}
```

#### `ApiContextWithEvaluation`

Extended context with evaluation data. Added by `withEvaluation` middleware.

```typescript
interface ApiContextWithEvaluation extends ApiContext {
  evaluation: EvaluationInContext
}
```

#### `ApiContextWithRolesAndEvaluation`

Combined context with both roles and evaluation.

#### `ExtendedApiContext`

Union type of all possible context variations. Useful for flexible handlers.

## Examples

### Basic API Handler

```typescript
import type { ApiContext } from '@/types/api'
import { withApiContext } from '@/middleware/withApiContext'

const get = async (ctx: ApiContext): Promise<void> => {
  const { res } = ctx
  res.status(200).json({ message: 'Success' })
}

export default withApiContext({ GET: get })
```

### Handler with Authorization

```typescript
import type { ApiContextWithRoles } from '@/types/api'
import { withAuthorization } from '@/middleware/withAuthorization'
import { Role } from '@prisma/client'

const get = async (ctx: ApiContextWithRoles): Promise<void> => {
  const { res, roles } = ctx
  // roles is guaranteed to exist
  res.status(200).json({ roles })
}

export default withAuthorization(withApiContext({ GET: get }), {
  roles: [Role.PROFESSOR],
})
```

### Handler with Evaluation

```typescript
import type { ApiContextWithEvaluation } from '@/types/api'
import { withEvaluation } from '@/middleware/withEvaluation'

const get = async (ctx: ApiContextWithEvaluation): Promise<void> => {
  const { res, evaluation } = ctx
  // evaluation is guaranteed to exist
  res.status(200).json({ phase: evaluation.phase })
}

export default withEvaluation(withApiContext({ GET: get }))
```

## Adding New Types

When adding new types:

1. **API types** → Add to `types/api/` directory
2. **Frontend types** → Add to `types/frontend/` directory (create when needed)
3. **Shared types** (used across API and frontend) → Consider adding to both or create `types/shared/`
4. **Always re-export** → Add exports to domain `index.ts` and main `types/index.ts`
5. **Document** → Add JSDoc comments explaining when to use each type

## Best Practices

1. Use `interface` for extensible types (like ApiContext)
2. Use `type` for unions, intersections, and computed types
3. **API routes**: Import from `@/types/api` explicitly
4. **Frontend components**: Import from `@/types/frontend` (when added)
5. Add JSDoc comments for complex types
6. Keep types focused and single-purpose
7. Separate API and frontend types for better organization
