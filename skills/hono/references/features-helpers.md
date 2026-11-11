---
name: features-helpers
description: Hono helpers - cookie, jwt, proxy, html, streaming (SSE), websocket, ssg, factory, dev, accepts, conninfo and css.
---

# Helpers

## Cookie (`hono/cookie`)

```ts
import { setCookie, getCookie, deleteCookie, setSignedCookie, getSignedCookie } from 'hono/cookie'

app.get('/cookie', (c) => {
  setCookie(c, 'cookie_name', 'cookie_value')
  const value = getCookie(c, 'cookie_name')
  const all = getCookie(c)            // all cookies
  deleteCookie(c, 'cookie_name')
  return c.text('ok')
})
```

Signed cookies (`setSignedCookie` / `getSignedCookie`) use HMAC SHA-256 via WebCrypto and therefore return a **Promise**.

## JWT (`hono/jwt`)

```ts
import { sign, verify, decode } from 'hono/jwt'

const token = await sign({ sub: 'user123', role: 'admin' }, 'secret', 'HS256')
const payload = await verify(token, 'secret', 'HS256')
```

`sign(payload, secret, alg?)` → `Promise<string>`; `verify(token, secret, alg?)` → `Promise<payload>`.

## Proxy (`hono/proxy`)

```ts
import { proxy } from 'hono/proxy'

app.get('/proxy/:path', (c) => proxy(`http://${originServer}/${c.req.param('path')}`))
```

A `fetch`-like wrapper that rewrites `Accept-Encoding` for the current runtime and strips unnecessary response headers.

## HTML (`hono/html`)

```ts
import { html, raw } from 'hono/html'

app.get('/:username', (c) => c.html(html`<h1>${c.req.param('username')}</h1>`))
```

`html` escapes interpolated values; `raw()` inserts a string as-is (you are responsible for escaping).

## Streaming (`hono/streaming`)

```ts
import { stream, streamText, streamSSE } from 'hono/streaming'

app.get('/sse', (c) =>
  streamSSE(c, async (stream) => {
    for await (const chunk of source) {
      await stream.writeSSE({ event: 'msg', data: chunk })
    }
  }),
)
```

- `stream(c, cb)` — generic streaming.
- `streamText(c, cb)` — `text/plain`, chunked, `X-Content-Type-Options: nosniff`. Use `stream.writeln()`, `stream.sleep()`.
- `streamSSE(c, cb)` — Server-Sent Events.
- `stream.onAbort(cb)` — cleanup when the client disconnects.
- On Cloudflare Workers with Wrangler, streaming may need `c.header('Content-Encoding', 'Identity')`.

## WebSocket (`hono/websocket`)

The adapter is a separate package per runtime:

```ts
import { upgradeWebSocket } from '@hono/cloudflare-workers'   // or @hono/node-server, @hono/bun, @hono/deno

app.get('/ws', (c) => upgradeWebSocket(c, (ws) => { ws.send('hello') }))
```

On Node.js, install `ws` and create a `WebSocketServer` with `{ noServer: true }`, passing it to `serve()` via the `websocket` option. `@hono/node-ws` is deprecated.

## Others

| Helper | Import | Purpose |
|---|---|---|
| `factory` | `hono/factory` | `createFactory()` + `factory.createHandlers()` for typed controller-style handlers |
| `dev` | `hono/dev` | `showRoutes(app)`, `getRouterName()` |
| `accepts` | `hono/accepts` | content negotiation |
| `conninfo` | `hono/conninfo` | connection info (Cloudflare) |
| `css` | `hono/css` | CSS helpers |
| `route` | `hono/route` | typed route helpers |
| `ssg` | `hono/ssg` | static site generation |
| `testing` | `hono/testing` | `testClient(app)` |

<!--
Source references:
- https://hono.dev/docs/helpers/cookie
- https://hono.dev/docs/helpers/jwt
- https://hono.dev/docs/helpers/proxy
- https://hono.dev/docs/helpers/html
- https://hono.dev/docs/helpers/streaming
- https://hono.dev/docs/helpers/websocket
- https://hono.dev/docs/helpers/factory
- https://hono.dev/docs/helpers/dev
- https://hono.dev/docs/helpers/ssg
- https://hono.dev/docs/helpers/testing
-->
