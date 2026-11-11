---
name: core-routing
description: Void server routing - file-based routes, defineHandler, validation with withValidator, route matching priority, route groups and middleware.
---

# Server Routing

A file in `routes/` becomes an endpoint. Void uses **Hono** for routing and middleware under the hood.

```ts
// routes/api/users.ts
import { defineHandler } from 'void'
import { db } from 'void/db'
import { users } from '@schema'

export const GET = defineHandler(async (c) => {
  return c.json(await db.select().from(users))
})
```

Extensions: `.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.mjs`.

## Route patterns

| Pattern | Meaning |
|---|---|
| `[id]` | dynamic segment → route param |
| `[...slug]` | catch-all |
| `(admin)` | route group — organizes files, does not change the URL |
| `_` or `.` prefix | excluded from routing (`.well-known` stays available) |

### Matching priority

When several routes match, the **most specific** wins — compared segment by segment from the left:

```
routes/
  users/[id].ts        →  handles /users/about   (users beats [lang])
  [lang]/about.ts      →  handles /fr/about      (about beats [slug])
  [lang]/[slug].ts     →  handles /fr/contact
  [...path].ts         →  handles anything else
```

Static > `[param]` > `[...slug]`. Parameter **names don't affect** the order — `[id].ts` and `[slug].ts` match the same URLs, so keep only one.

## Validation

```ts
export const POST = defineHandler.withValidator({
  body: z.object({ name: z.string() }),
})((c) => {
  const { name } = c.req.valid('body')
  return c.json({ ok: true })
})
```

Validator schemas become the **input types** for the typed client — `fetch('/api/users', { method: 'POST', body: ... })` is checked against them.

## Middleware

Global request middleware lives in `middleware/`. Since routing is Hono-based, the familiar Hono middleware model applies (`await next()`, return a `Response` to short-circuit).

## Typed fetch

```ts
import { fetch } from 'void/client'

const users = await fetch('/api/users')            // response type inferred
await fetch('/api/users', { method: 'POST', body: { name: 'Ada' } })  // body checked
```

The client constrains every part of the request:

- **Paths** — only routes defined in `routes/` are accepted; typos fail at compile time.
- **Methods** — only methods exported by the route file; `POST` on a GET-only file is an error.
- **Body/query/params** — from `defineHandler.withValidator()`.
- **Response** — inferred from the handler's return type.

Route patterns use the same brackets as the filenames: `/users/[id]`, `/docs/[...slug]`.

<!--
Source references:
- https://void.cloud/guide/server-routing
- https://void.cloud/guide/typed-fetch
- https://void.cloud/guide/type-safety
-->
