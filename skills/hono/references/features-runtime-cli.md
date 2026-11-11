---
name: features-runtime-cli
description: Running Hono on Cloudflare Workers, Node.js, Bun, Deno and other runtimes - adapters, export patterns, and the Web Standards model.
---

# Runtimes & Deployment

Hono is built on **Web Standards** (`Request`, `Response`, `Headers`, `URL`, `fetch`), so the same app code runs on any runtime that implements them.

Supported: Cloudflare Workers (`workerd`), Deno, Bun, Fastly Compute, AWS Lambda, Node.js, Vercel (edge), WebAssembly (WASI).

## The app is a fetch handler

```ts
import { Hono } from 'hono'

const app = new Hono()
app.get('/', (c) => c.text('Hello!'))

export default app
```

## Node.js

```sh
npm install @hono/node-server
```

```ts
import { serve } from '@hono/node-server'

serve({ fetch: app.fetch, port: 3000 })
```

For static files, add `serveStatic` from `@hono/node-server/serve-static`.

> **v5 note**: Node.js **22.12+** is required, and Hono v5 is **ESM only** (the CJS build is removed). `require('hono')` still works on 22.12+ because Node can `require()` ESM.

## Bun

```ts
export default { port: 3000, fetch: app.fetch }
```

```sh
bun run src/index.ts
```

## Deno

```ts
Deno.serve(app.fetch)
```

## Cloudflare Workers

```ts
export default app
```

Bindings and secrets arrive via `c.env`. Use `wrangler` for local dev (`wrangler dev`) and deploy.

## Other adapters

| Runtime | Package |
|---|---|
| AWS Lambda | `@hono/aws-lambda` |
| Lambda@Edge | `@hono/lambda-edge` |
| Cloudflare Workers | `@hono/cloudflare-workers` |
| Deno | `@hono/deno` |
| Bun | `@hono/bun` |
| Netlify | `@hono/netlify` |
| Vercel | `@hono/vercel` |
| Node.js | `@hono/node-server` |

> **v5 note**: runtime adapters moved **out of the `hono` package** — `hono/cloudflare-workers` becomes `@hono/cloudflare-workers`, and so on for every runtime.

## Routers / presets

| Import | Router |
|---|---|
| `hono` | `SmartRouter` → `RegExpRouter` + `TrieRouter` (default; fastest) |
| `hono/quick` | `SmartRouter` → `LinearRouter` + `TrieRouter` |
| `hono/tiny` | `PatternRouter` (smallest) |

`getRouterName()` from `hono/dev` tells you which one is active. `showRoutes(app)` prints the route table — useful for debugging.

<!--
Source references:
- https://hono.dev/docs/concepts/web-standard
- https://hono.dev/docs/getting-started/nodejs
- https://hono.dev/docs/getting-started/bun
- https://hono.dev/docs/getting-started/deno
- https://hono.dev/docs/getting-started/cloudflare-workers
- https://hono.dev/docs/api/presets
- https://hono.dev/docs/concepts/routers
- https://hono.dev/docs/guides/migrating-to-v5
-->
