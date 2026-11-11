---
name: features-api
description: Next.js Route Handlers, the Web Request/Response APIs, NextRequest/NextResponse, Proxy (formerly middleware), and instrumentation.
---

# Route Handlers & Proxy

## Route Handlers

```tsx
// app/api/users/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const users = await db.user.findMany()
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const body = await request.json()
  const user = await db.user.create({ data: body })
  return NextResponse.json(user, { status: 201 })
}
```

- Defined in `route.ts` inside `app/` — can be nested anywhere, but **cannot** coexist with `page.tsx` in the same segment.
- Methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`. Unsupported → `405`.
- They use the standard Web `Request`/`Response`; `NextRequest`/`NextResponse` add helpers (cookies, `nextUrl`, rewrites, geo/ip).
- Route Handlers are **not cached by default**. Only `GET` can opt in (`export const dynamic = 'force-static'`); other methods are never cached.
- With Cache Components enabled, `GET` handlers follow the same prerender model as pages — they run at request time by default and can use `use cache`.

```tsx
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return Response.json(await getPost(id))
}
```

## Proxy (formerly middleware)

```tsx
// proxy.ts — project root, same level as app/ or pages/
import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
```

- **Next.js 16 renamed `middleware.ts` to `proxy.ts`** — same functionality, clearer intent. Keep `middleware.ts` only for older versions.
- Proxy runs **before** a request completes: rewrite, redirect, modify headers, or respond directly.
- Use it for header manipulation, A/B rewrites, and programmatic redirects. For simple redirects prefer the `redirects` config in `next.config.ts`.
- **Not** for slow data fetching, session management, or full authorization — use optimistic checks only.
- `'use cache'` and `'use server'` have **no effect** in Proxy (no directive transforms), and `fetch` cache options do not cache there.
- Use the `matcher` config to limit which paths run it.

## Instrumentation

```ts
// instrumentation.ts — project root
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { register } = await import('./instrumentation-node')
    register()
  }
}
```

Runs once per server start (and per edge runtime). Use it for monitoring, tracing, or polyfills. `instrumentation-client.ts` runs in the browser.

## Environment variables

- `process.env.NEXT_PUBLIC_*` is inlined into the **client bundle** — never put secrets there.
- Server-only env vars are read in Server Components, Server Actions and Route Handlers.
- Use `next.config.ts` `env` for build-time constants; prefer runtime env vars for anything secret.

<!--
Source references:
- https://nextjs.org/docs/app/getting-started/route-handlers
- https://nextjs.org/docs/app/api-reference/file-conventions/route
- https://nextjs.org/docs/app/getting-started/proxy
- https://nextjs.org/docs/app/api-reference/functions/next-request
- https://nextjs.org/docs/app/api-reference/functions/next-response
- https://nextjs.org/docs/app/guides/instrumentation
-->
