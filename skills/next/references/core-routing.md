---
name: core-routing
description: Next.js App Router file-system routing, layouts, pages, dynamic segments, route groups, parallel and intercepting routes, and client-side navigation.
---

# Routing & Layouts

Next.js uses **file-system routing**: folders define URL segments, files define UI.

## Conventions

| File | Purpose |
|---|---|
| `page.tsx` | UI for a route — the **leaf** of a route subtree. Required to make a segment public. |
| `layout.tsx` | Shared UI wrapping a segment and its children; receives `children` |
| `template.tsx` | Like a layout but **remounts** on navigation (fresh state) |
| `route.ts` | HTTP endpoint (Route Handler) — **cannot** coexist with `page.tsx` in the same segment |
| `loading.tsx` | Suspense fallback for the segment |
| `error.tsx` | Error Boundary for the segment (Client Component) |
| `not-found.tsx` | 404 UI for the segment |
| `global-error.tsx` | Root-level error UI (replaces the root layout) |
| `forbidden.tsx` / `unauthorized.tsx` | 403 / 401 UI |
| `default.tsx` | Fallback for unmatched **parallel route** slots |
| `proxy.ts` | Next.js 16 name for `middleware.ts` |

- The **root layout** (`app/layout.tsx`) is **required** and must contain `<html>` and `<body>`.
- Layouts **preserve state** and do not re-render on navigation; templates do re-mount.
- `error.tsx` wraps `loading.tsx`, `not-found.tsx`, `page.tsx` and nested layouts — but **not** the `layout.tsx`/`template.tsx` in the *same* segment. Use `global-error.tsx` for the root layout.
- `error.tsx` must be a Client Component; `reset()` re-renders the segment.

## Dynamic segments

```
app/blog/[slug]/page.tsx        →  /blog/:slug
app/blog/[...slug]/page.tsx     →  /blog/a/b/c   (catch-all)
app/blog/[[...slug]]/page.tsx   →  /blog         (optional catch-all)
```

`params` is a **Promise** in Next.js 15+ — always `await` it:

```tsx
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  return <article>{post.title}</article>
}
```

`searchParams` is a Promise too. Use `use(params)` as an alternative to `await`.

Static params for SSG:

```tsx
export async function generateStaticParams() {
  return (await getPosts()).map(p => ({ slug: p.slug }))
}
```

## Route groups & parallel routes

- `(marketing)/about/page.tsx` → `/about`. Parentheses create a group **without** affecting the URL; use it to organize layouts.
- `@team` is a **slot** (parallel route). `app/dashboard/@team/page.tsx` and `app/dashboard/@analytics/page.tsx` render side by side.
- `app/@modal/(.)photo/[id]/page.tsx` — interception: `(.)` same level, `(..)` one level up, `(..)(..)` two levels up.
- Provide `default.tsx` for each slot, otherwise a hard navigation returns 404.

## Linking and navigation

```tsx
import Link from 'next/link'

<Link href="/dashboard" scroll={false} prefetch>Dashboard</Link>
```

- Use `<Link>` for internal navigation — it prefetches and does client-side transitions.
- `replace` replaces the history entry; `scroll={false}` keeps the scroll position.
- `<a>` for external links.

Client-side navigation hooks (Client Components only):

| Hook | Returns |
|---|---|
| `useRouter()` | `push`, `replace`, `refresh`, `back`, `forward`, `prefetch` |
| `usePathname()` | current pathname |
| `useSearchParams()` | read-only `URLSearchParams` |
| `useParams()` | dynamic segment params |
| `useSelectedLayoutSegment(s)` | active segment for the layout |

- `usePathname`/`useSearchParams` force the component into the client bundle — read the URL on the server from `searchParams` instead when possible.
- `useSearchParams` in a **statically rendered** route requires a `<Suspense>` boundary, or the whole route becomes dynamic.
- `router.refresh()` re-fetches the server components of the current route but does **not** invalidate server-side caches — use `revalidatePath`/`revalidateTag` for that.

## Route segment config

```tsx
export const dynamic = 'force-dynamic'   // 'auto' | 'force-dynamic' | 'error'
export const revalidate = 3600            // seconds
export const fetchCache = 'force-cache'
export const runtime = 'edge'
export const maxDuration = 30
export const dynamicParams = true
```

These are **static exports** — they must be statically analyzable, not computed at runtime.

<!--
Source references:
- https://nextjs.org/docs/app/getting-started/layouts-and-pages
- https://nextjs.org/docs/app/api-reference/file-conventions/page
- https://nextjs.org/docs/app/api-reference/file-conventions/layout
- https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes
- https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes
- https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes
- https://nextjs.org/docs/app/getting-started/linking-and-navigating
- https://nextjs.org/docs/app/api-reference/functions/use-router
-->
