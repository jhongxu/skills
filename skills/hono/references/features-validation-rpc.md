---
name: features-validation-rpc
description: Hono input validation with validator/zValidator/Standard Schema, and end-to-end typed RPC with the Hono Client (hc).
---

# Validation & RPC

## Validation

Hono's built-in `validator` is a thin layer; combine it with a schema library.

```ts
import { validator } from 'hono/validator'

app.post('/posts', validator('form', (value, c) => {
  const body = value['body']
  if (!body || typeof body !== 'string') return c.text('Invalid!', 400)
  return { body }              // return the validated value
}), (c) => {
  const { body } = c.req.valid('form')
  return c.json({ message: 'Created!' })
})
```

Targets: `json`, `query`, `header`, `param`, `cookie`, `form`.

### With Zod

```ts
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const route = app.post('/posts', zValidator('form', z.object({
  title: z.string(),
  body: z.string(),
})), (c) => {
  const { title } = c.req.valid('form')
  return c.json({ title })
})
```

`@hono/standard-validator` works with any **Standard Schema** library (Zod, Valibot, ArkType…).

## RPC

Share the API spec between server and client with types.

### Server

```ts
export type AppType = typeof route      // or typeof app
```

### Client

```ts
import { hc } from 'hono/client'

const client = hc<AppType>('http://localhost:8787/')

const res = await client.posts.$post({
  form: { title: 'Hello', body: 'Hono is a cool project' },
})

if (res.ok) {
  const data = await res.json()
}
```

- The client call mirrors the route: `client.posts.$post()` for `POST /posts`.
- The response is a real `Response` — `res.json()`, `res.ok`, `res.status` all work.
- Send cookies with `hc<AppType>(url, { init: { credentials: 'include' } })`.
- If the handler sets an explicit status code (`c.json(data, 404)`), the client type is narrowed by status so you can branch on `res.status === 404`.
- For monorepos, set `"strict": true` in **both** tsconfigs or the RPC types will not resolve.

### Global error responses

The client does not infer types from `app.onError()` or global middleware. Use `ApplyGlobalResponse`:

```ts
import type { ApplyGlobalResponse } from 'hono/client'

type AppWithErrors = ApplyGlobalResponse<typeof app, {
  500: { json: { error: string } }
}>
```

<!--
Source references:
- https://hono.dev/docs/guides/validation
- https://hono.dev/docs/guides/rpc
-->
