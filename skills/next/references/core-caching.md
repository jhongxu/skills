---
name: core-caching
description: Next.js Cache Components - the 'use cache' directive, cacheLife profiles, cacheTag, revalidatePath, revalidateTag, updateTag, and prerendering vs dynamic rendering.
---

# Caching & Revalidation

Next.js 16 has two caching models. **Cache Components** is the new default model; the previous model (`fetch` cache options, `revalidate`, `unstable_cache`) still works but is legacy.

## Cache Components (current model)

Enable in `next.config.ts`:

```ts
export default {
  cacheComponents: true,
  partialPrefetching: true,   // set explicitly; leaving it unset logs a warning
}
```

New apps created by `create-next-app` already have both enabled.

### `use cache`

```tsx
// data-level
async function getProducts() {
  'use cache'
  return db.products.findMany()
}

// UI-level
async function BlogPosts() {
  'use cache'
  return <List items={await getPosts()} />
}
```

- The directive goes at the top of an **async** function, component, or file. At file level it applies to all exports.
- Arguments and captured parent-scope values become part of the **cache key** — different inputs get separate entries.
- **Read cookies and headers outside the cached scope** and pass the values in as arguments.
- Pair every cache directive with a [`cacheLife`](#cachelife); without one the implicit `default` profile applies.

### `cacheLife` — time-based revalidation

```tsx
import { cacheLife } from 'next/cache'

async function getPosts() {
  'use cache'
  cacheLife('hours')       // or cacheLife({ stale: 30, revalidate: 60, expire: 3600 })
  return db.posts.findMany()
}
```

| Profile | stale | revalidate | expire |
|---|---|---|---|
| `default` | 5m | 15m | never |
| `seconds` | 30s | 1s | 60s |
| `minutes` | 5m | 1m | 1h |
| `hours` | 5m | 1h | 1d |
| `days` | 5m | 1d | 1w |
| `weeks` | 5m | 1w | 30d |
| `max` | 5m | 30d | 1y |

A cache using `seconds`, `revalidate: 0`, or `expire` under 5 minutes is **short-lived**: it is excluded from prerenders and becomes a dynamic hole instead.

### `cacheTag` — tagging cached data

```tsx
import { cacheTag } from 'next/cache'

async function getPost(id: string) {
  'use cache'
  cacheTag(`post:${id}`)
  return db.post.findUnique({ where: { id } })
}
```

## On-demand revalidation

| Function | Where | Semantics |
|---|---|---|
| `updateTag(tag)` | **Server Actions only** | Immediately expires the tag; next request blocks for fresh data — **read-your-own-writes** |
| `revalidateTag(tag, profile)` | Server Actions, Route Handlers | Marks data stale; next request serves stale content while revalidating (SWR). `profile="max"` recommended; `{ expire: 0 }` blocks |
| `revalidatePath(path, type?)` | Server Actions, Route Handlers | Invalidates a specific path (literal like `/product/1`) or a pattern (`/product/[slug]` + `type: 'page' \| 'layout'`) |

- `revalidatePath`/`revalidateTag` cannot be called in Client Components or Proxy.
- `updateTag` cannot be called in Route Handlers — use `revalidateTag` there.

## Prerendering vs dynamic rendering

- **Prerendering** happens at build time (or cached and revalidated later). The result becomes part of the **static shell** and can be prefetched.
- **Dynamic rendering** happens per request. Triggered by request-time APIs (`cookies`, `headers`, `searchParams`), uncached fetches, or `dynamic = 'force-dynamic'`.
- A route becomes fully dynamic if a request-time API is used in the **root layout**.
- With Cache Components, a page can be **partially prerendered**: the static shell ships immediately and the dynamic parts stream in.

## Common mistakes

- Expecting `fetch` to be cached by default — it is not (Next 15+).
- Calling `revalidateTag` from a Client Component — server-only.
- Putting `cookies()` in the root layout and accidentally making the whole app dynamic.
- Using `revalidatePath` with a literal path when you meant to clear a whole dynamic segment (needs `type: 'page'`).
- Forgetting `cacheLife` and getting the implicit `default` profile by accident.

<!--
Source references:
- https://nextjs.org/docs/app/getting-started/caching
- https://nextjs.org/docs/app/getting-started/revalidating
- https://nextjs.org/docs/app/api-reference/directives/use-cache
- https://nextjs.org/docs/app/api-reference/functions/cacheLife
- https://nextjs.org/docs/app/api-reference/functions/cacheTag
- https://nextjs.org/docs/app/api-reference/functions/updateTag
- https://nextjs.org/docs/app/api-reference/functions/revalidateTag
- https://nextjs.org/docs/app/api-reference/functions/revalidatePath
-->
