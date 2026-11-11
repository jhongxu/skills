---
name: core-data-fetching
description: Fetching data in Next.js App Router - fetch, ORMs, streaming with Suspense, request-time APIs, and deduplicating with React cache.
---

# Data Fetching

## In Server Components

Any async I/O works — the component is just an `async` function:

```tsx
export default async function Page() {
  const res = await fetch('https://api.example.com/posts')
  const posts = await res.json()
  return <PostList posts={posts} />
}
```

- **Identical `fetch` requests in a React tree are memoized** — fetch in the component that needs the data instead of drilling props down.
- `fetch` is **not cached by default** and blocks rendering until it resolves. Use `use cache` to cache it, or `<Suspense>` to stream it.
- With an **ORM or database**, credentials and query code stay out of the client bundle. Still authenticate and authorize every query.

## Deduplicating with React `cache`

```tsx
import { cache } from 'react'

export const getUser = cache(async (id: string) => db.user.findUnique({ where: { id } }))
```

`cache` memoizes per request. Use it for functions called in multiple places during one render.

## Streaming

A slow fetch blocks the whole route. Stream it instead:

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      <Header />                        {/* renders immediately */}
      <Suspense fallback={<Skeleton />}>
        <SlowList />                    {/* streams in when ready */}
      </Suspense>
    </>
  )
}
```

Two ways to stream: a `loading.tsx` file (wraps the segment) or a `<Suspense>` boundary (wraps a component). `<Suspense>` gives finer control and lets the rest of the page render.

## Request-time APIs

```tsx
import { cookies, headers } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()      // async in Next 15+
  const h = await headers()
  const theme = cookieStore.get('theme')
  return <p>{theme?.value}</p>
}
```

- `cookies()`, `headers()`, `draftMode()` are **async** — `await` them.
- `cookies().set()` / `delete()` only work in a **Server Action or Route Handler** (mutating the outgoing response).
- Reading them makes the route **dynamic**. Wrap only the component that needs them in `<Suspense>` so the rest stays prerendered.
- `searchParams` is a request-time API too.

## Where to fetch

| Location | Use for |
|---|---|
| Server Component | almost everything — closest to the data source |
| Server Action | mutations (writes) |
| Route Handler | webhooks, third-party callbacks, custom public endpoints |
| Client Component | only for client-only data (browser state, infinite scroll); use SWR / React Query for caching, or the framework's own primitives |

Do **not** call your own Route Handler from a Server Component — it adds a network round trip. Import the data function directly.

## Client-side data fetching

For data that lives on the client, use a dedicated library (SWR / TanStack Query) rather than `useEffect` + `fetch`. They handle caching, deduplication, retries and revalidation.

<!--
Source references:
- https://nextjs.org/docs/app/getting-started/fetching-data
- https://nextjs.org/docs/app/guides/streaming
- https://nextjs.org/docs/app/api-reference/functions/cookies
- https://nextjs.org/docs/app/api-reference/functions/headers
- https://nextjs.org/docs/app/guides/client-side-data-fetching
-->
