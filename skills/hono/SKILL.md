---
name: hono
description: Hono web framework - Web Standards routing, middleware, Context, validators, typed RPC with the Hono Client, JSX/SSR, streaming, WebSocket, and multi-runtime deployment. Use when building an API or edge server with Hono.
metadata:
  author: jianghongxu
  version: "2026.11.11"
  source: Generated from https://github.com/honojs/website, scripts at https://github.com/jhongxu/skills
---

# Hono

> Based on Hono v4 (stable), generated at 2026-11-11. v5 is in RC — see the migration notes.

## Preferences

- Prefer TypeScript over JavaScript.
- Prefer Hono's typed helpers (`hc`, `zValidator`, `zod-openapi`) over raw `fetch` and hand-rolled validation.
- Keep handlers thin: extract business logic into plain functions and unit-test them.
- Middleware order is significant — put auth/CORS/logging before the handlers they affect.
- Prefer `c.env` for bindings/secrets over `process.env` so the code runs on every runtime.
- Always return an explicit `Response`; use the context helpers (`c.json`, `c.text`, `c.html`) instead of `new Response`.

## Core

| Topic | Description | Reference |
|-------|-------------|--------|
| The App & Context | `new Hono()`, instance methods, `c.req`/`c.res`, `c.env`, typed Variables, HTTPException | [core-app](references/core-app.md) |
| Routing | Path params, optional/regexp params, chaining, sub-apps, base paths, host routing, priority | [core-routing](references/core-routing.md) |
| Middleware | The onion model, execution order, custom middleware, early return, error propagation | [core-middleware](references/core-middleware.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|--------|
| Built-in Middleware | cors, jwt, logger, basic/bearer auth, body-limit, cache, compress, etag, secure-headers, timeout, csrf | [features-builtin-middleware](references/features-builtin-middleware.md) |
| Helpers | cookie, jwt, proxy, html, streaming/SSE, websocket, ssg, factory, dev | [features-helpers](references/features-helpers.md) |
| Validation & RPC | `validator`/`zValidator`, Standard Schema, typed client with `hc`, `AppType` | [features-validation-rpc](references/features-validation-rpc.md) |
| JSX & Testing | `hono/jsx` SSR, `app.request()`, `testClient`, Vitest, the agent-oriented Hono CLI | [features-jsx-testing](references/features-jsx-testing.md) |
| Runtimes & Deployment | Cloudflare Workers, Node, Bun, Deno, adapters, routers/presets | [features-runtime-cli](references/features-runtime-cli.md) |

## Best Practices

| Topic | Description | Reference |
|-------|-------------|--------|
| Structure & Security | Avoid controllers, split by resource, input validation, secrets, v4 → v5 checklist | [best-practices](references/best-practices.md) |

## Quick Reference

### App

```ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id })
})

app.post('/users', async (c) => {
  const body = await c.req.json()
  return c.json(body, 201)
})

export default app
```

### Middleware

```ts
app.use('/api/*', cors())
app.use(logger())

app.use(async (c, next) => {
  await next()
  c.header('X-Debug', '1')
})
```

### Validation + typed client

```ts
const route = app.post('/posts',
  zValidator('json', z.object({ title: z.string() })),
  (c) => c.json(c.req.valid('json')),
)
export type AppType = typeof route
```

```ts
const client = hc<AppType>('http://localhost:8787/')
const res = await client.posts.$post({ json: { title: 'Hi' } })
```

### Things that bite

- Middleware must `await next()` to continue; returning a `Response` short-circuits.
- Route handlers run in **registration order** — register specific paths before wildcards.
- `c.set`/`c.get` values live only for the current request.
- `HTTPException.getResponse()` does not carry headers set on `c`.
- v5: ESM only, Node 22.12+, adapters moved to `@hono/*` packages.
