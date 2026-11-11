---
name: core-app
description: Creating a Hono app, the Hono instance methods, the Context object, request/response helpers, environment bindings, and typed variables.
---

# The App & Context

## Creating an app

```ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Hello!'))

export default app
```

`export default app` works on every runtime — Cloudflare Workers uses `export default { fetch }` under the hood via the adapter, Node/Bun use `@hono/node-server`.

### Hono instance methods

| Method | Purpose |
|---|---|
| `app.get/post/put/delete/patch/options/query/all(path, ...handlers)` | register a route |
| `app.on(method \| method[], path \| path[], handler)` | register for multiple methods/paths |
| `app.use([path], middleware)` | register middleware (any method) |
| `app.route(path, subApp)` | mount a sub-app under a prefix |
| `app.basePath(path)` | set a base path for the app |
| `app.notFound(handler)` | customize the 404 response |
| `app.onError(handler)` | global error handler |
| `app.mount(path, anotherApp, options?)` | mount another Hono app |
| `app.fetch(request, env, event)` | the fetch entrypoint |
| `app.request(path, options)` | make a request against the app (testing) |

## Context

`Context` (`c`) is created per request and lives until the response is returned.

```ts
app.get('/post', async (c) => {
  const id = c.req.param('id')          // path param
  const q = c.req.query('q')            // query param
  const ua = c.req.header('User-Agent') // request header
  const body = await c.req.json()       // parsed body
  const valid = c.req.valid('form')     // validated input
  const user = c.get('user')            // variable set by middleware
  const env = c.env                     // runtime bindings/secrets
  const ctx = c.executionCtx            // waitUntil / passThroughOnException

  c.status(201)
  c.header('X-Message', 'hi')
  return c.json({ ok: true })
})
```

Response helpers — always use these instead of `new Response`:

| Helper | Result |
|---|---|
| `c.text(body, status?)` | `text/plain` |
| `c.json(obj, status?)` | `application/json` |
| `c.html(str, status?)` | `text/html` |
| `c.body(str, status?, headers?)` | raw body with explicit headers |
| `c.notFound()` | 404 response |
| `c.redirect(path, status = 302)` | redirect response |

`c.res` gives access to the outgoing `Response` (e.g. to append headers after `await next()`).

### Environment bindings

`c.env` holds the runtime's bindings and secrets (Cloudflare Workers bindings, Deno env, etc.). **Prefer `c.env` over `process.env`** so the code runs on every runtime and secrets stay out of the client bundle.

### Typed variables

```ts
type Variables = { user: { id: string } }

const app = new Hono<{ Variables: Variables }>()

app.use(async (c, next) => {
  c.set('user', { id: '1' })
  await next()
})

app.get('/', (c) => c.json(c.get('user')))   // typed
```

`c.set` / `c.get` values live **only for the current request** — they are not shared across requests.

### Errors

```ts
import { HTTPException } from 'hono/http-exception'

throw new HTTPException(401, { message: 'Unauthorized' })

app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse()
  return c.text('Internal Server Error', 500)
})
```

`HTTPException` accepts `{ message }` for text responses or `{ res }` for a custom `Response`. Note `getResponse()` is **not** aware of `Context` — copy headers you set on `c` onto the new response yourself.

<!--
Source references:
- https://hono.dev/docs/api/hono
- https://hono.dev/docs/api/context
- https://hono.dev/docs/api/exception
- https://hono.dev/docs/concepts/web-standard
-->
