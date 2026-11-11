---
name: core-types
description: Void's type pipeline - Drizzle schema to RouteMap to typed fetch, InferProps for page loaders, validator schemas in actions, and the generated .void types.
---

# Type Safety

Void infers types from your **database schema**, **route handlers** and **page loaders**. Change a field and TypeScript shows which queries, requests and components need to change.

## The pipeline

```
Drizzle schema
   ├─→ database types (compile time)
   ├─→ route handler return types + validator schemas
   │      └─→ generated RouteMap → typed fetch()
   ├─→ page loader return types → InferProps → component props
   └─→ page action validator schemas → useForm() / action()
```

All generated types live in `.void/` and update automatically when source files or the schema change.

## Typed fetch

```ts
import { fetch } from 'void/client'

const users = await fetch('/api/users')                       // GET → inferred response
const created = await fetch('/api/users', {
  method: 'POST',
  body: { name: 'Ada' },                                     // body checked
})
```

- **Paths** — only routes defined in `routes/` are accepted.
- **Methods** — only methods exported by the route file.
- **Body/query/params** — from `defineHandler.withValidator()`.
- **Response** — the handler's return type after JSON serialization.

## Page props

```ts
export const loader = defineHandler(async (c) => ({ users: [...] }))
export type Props = InferProps<typeof loader>
```

The component imports `Props` from the `.server.ts` file — one source of truth.

## Typed URLs

With `routing.typedRoutes` enabled, URLs are checked like route paths — `c.redirect('/users/1')` and links are validated against the real routes. For a string TypeScript cannot check, cast it with `as Href`.

## Serialization

Void preserves rich types (`Date`, `Map`, `Set`, `bigint`, `RegExp`, `URL`, `undefined`, cyclic references) in page props and shared data. **Functions and custom class instances cannot cross the boundary.**

<!--
Source references:
- https://void.cloud/guide/type-safety
- https://void.cloud/guide/typed-fetch
-->
