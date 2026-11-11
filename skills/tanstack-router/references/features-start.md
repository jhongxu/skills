---
name: features-start
description: TanStack Start - the full-stack framework on top of TanStack Router - server functions, server routes, middleware, the execution model, SPA mode and ISR.
---

# TanStack Start

A **full-stack** framework powered by TanStack Router: full-document SSR, streaming, server functions, and separate server/client builds, built on Vite or Rsbuild.

```sh
npx @tanstack/cli@latest create
```

> TanStack Start is **stable**.

## Execution model — isomorphic by default

**All code is isomorphic by default**: it ships in both the server and client bundles unless you explicitly constrain it.

```tsx
// ✅ runs on BOTH server and client
function formatPrice(price: number) { /* ... */ }
```

⚠️ **Route `loader`s are isomorphic** — they run on the server *and* the client. Do not put secrets or privileged calls in a loader; use a server function.

## Server functions

```tsx
// src/lib/server.ts
import { createServerFn } from '@tanstack/react-start'

export const getServerTime = createServerFn().handler(async () => {
  return new Date().toISOString()   // runs only on the server
})
```

- Callable from loaders, components, hooks and other server functions.
- Start handles serialization across the client/server boundary.
- They are **same-origin RPC endpoints** — verify with Fetch Metadata (`Sec-Fetch-Site`), `Origin` or `Referer`.
- Use `createCsrfMiddleware()` to protect them. If you define `src/start.ts`, add it explicitly — otherwise Start installs it automatically.

```tsx
// src/start.ts
import { createStart, createCsrfMiddleware } from '@tanstack/react-start'

export const createStart = () => createCsrfMiddleware()
```

## Server routes

Raw HTTP endpoints, defined **alongside** app routes in `src/routes/`:

```ts
// src/routes/api/hello.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: async ({ request }) => Response.json({ ok: true }),
      POST: async ({ request }) => Response.json(await request.json()),
    },
  },
})
```

- Use server routes for **public/external** endpoints; use server functions for internal calls where Start handles serialization.
- A single file can define both an app route and a server route.

## Middleware

```tsx
// src/start.ts
import { createStart, createMiddleware } from '@tanstack/react-start'

const loggingMiddleware = createMiddleware().server(async ({ next }) => {
  console.log('request')
  return next()
})

export const createStart = () => createMiddleware().server(loggingMiddleware)
```

Middleware applies to server routes **and** server functions, and can depend on other middleware. Typical uses: authentication, authorization, logging, CSP, observability, request context.

## SPA mode

For apps that don't need SSR (no SEO, no crawler needs):

- the initial document contains only the app shell;
- the page is rendered on the client;
- **server features still work** — server functions and server routes are unaffected;
- simpler deployment (a static CDN is enough) and no hydration mismatches.

## ISR

Start's ISR is built on **standard HTTP cache headers**, so it works with any CDN:

1. pages are prerendered at build time,
2. cache headers control CDN caching,
3. after expiry the next request triggers regeneration,
4. stale content is served while fresh data is generated (stale-while-revalidate).

You control the behavior at page and data level through cache headers rather than a framework-specific API.

## Other guides worth knowing

`execution-model`, `selective-ssr` (SSR only where it matters), `deferred-hydration`, `early-hints`, `static-prerendering`, `static-server-functions`, `server-components`, `error-boundaries`, `hydration-errors`, `production-checklist`, `seo`, `observability`, `geo`.

<!--
Source references:
- https://tanstack.com/router/latest/docs/framework/react/start/overview
- https://tanstack.com/router/latest/docs/framework/react/start/getting-started
- https://tanstack.com/router/latest/docs/framework/react/start/framework/react/guide/execution-model
- https://tanstack.com/router/latest/docs/framework/react/start/framework/react/guide/server-functions
- https://tanstack.com/router/latest/docs/framework/react/start/framework/react/guide/server-routes
- https://tanstack.com/router/latest/docs/framework/react/start/framework/react/guide/middleware
- https://tanstack.com/router/latest/docs/framework/react/start/framework/react/guide/spa-mode
- https://tanstack.com/router/latest/docs/framework/react/start/framework/react/guide/isr
-->
