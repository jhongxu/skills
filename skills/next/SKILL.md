---
name: next
description: Next.js 16 App Router - file-system routing, Server and Client Components, Server Actions, Cache Components and use cache, Route Handlers, and deployment. Use when building or debugging a Next.js app.
metadata:
  author: jianghongxu
  version: "2026.11.11"
  source: Generated from https://github.com/vercel/next.js, scripts at https://github.com/jhongxu/skills
---

# Next.js

> Based on Next.js 16.5, generated at 2026-11-11. App Router only; Pages Router is legacy.

## Preferences

- Prefer the App Router over the Pages Router for new projects.
- Prefer TypeScript over JavaScript.
- Prefer Server Components by default; add `'use client'` only at the smallest interactive leaf.
- Prefer Server Actions over API routes for mutations.
- Do not use `getServerSideProps` / `getStaticProps` / `getInitialProps` in new App Router code.
- Keep data fetching close to the component that renders it; do not create a global data-fetching layer.
- Prefer `next/image`, `next/link`, `next/font` over their raw HTML equivalents.

## Core

| Topic | Description | Reference |
|-------|-------------|-----------|
| Routing & Layouts | File-system routing, page/layout/template, dynamic segments, groups, parallel & intercepting routes, navigation | [core-routing](references/core-routing.md) |
| Server & Client Components | `'use client'` / `'use server'`, the boundary, composition patterns, reducing the client bundle | [core-server-client](references/core-server-client.md) |
| Data Fetching | fetch, ORMs, streaming with Suspense, request-time APIs, React `cache` | [core-data-fetching](references/core-data-fetching.md) |
| Caching & Revalidation | Cache Components, `use cache`, `cacheLife`/`cacheTag`, `revalidatePath`/`revalidateTag`/`updateTag` | [core-caching](references/core-caching.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|--------|
| Mutations | Server Actions, forms, `useActionState`, `redirect`, cache invalidation after writes | [features-mutations](references/features-mutations.md) |
| Route Handlers & Proxy | `route.ts`, Web Request/Response, `NextRequest`/`NextResponse`, `proxy.ts`, instrumentation | [features-api](references/features-api.md) |
| Components & Config | `next/image`, `next/link`, `next/script`, `next/font`, `next/form`, Metadata API, `next.config.ts` | [features-components-config](references/features-components-config.md) |

## Best Practices

| Topic | Description | Reference |
|-------|-------------|--------|
| Production & Security | Checklist, auth patterns, data security, debugging, agent-facing bundled docs | [best-practices](references/best-practices.md) |

## Quick Reference

### Page with dynamic params (Next 15+: params is a Promise)

```tsx
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <article>{await getPost(slug)}</article>
}
```

### Server Component + small client leaf

```tsx
// page.tsx (Server Component)
export default async function Page() {
  const posts = await getPosts()
  return (
    <>
      <PostList posts={posts} />
      <LikeButton postId={posts[0].id} />   {/* 'use client' in its own file */}
    </>
  )
}
```

### Server Action

```tsx
// actions.ts
'use server'
export async function createPost(formData: FormData) {
  const post = await db.post.create({ data: { title: formData.get('title') as string } })
  updateTag(`post:${post.id}`)
  revalidatePath('/blog')
  redirect('/blog')
}
```

### Cache with a lifetime and a tag

```tsx
import { cacheLife, cacheTag } from 'next/cache'

async function getPosts() {
  'use cache'
  cacheLife('hours')
  cacheTag('posts')
  return db.posts.findMany()
}
```

### Route Handler

```tsx
// app/api/posts/route.ts
export async function GET() {
  return Response.json(await getPosts())
}
```

### Things that bite

- `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are **async** — `await` them.
- `fetch` is **not cached by default** in Next 15+.
- Middleware was renamed **`proxy.ts`** in Next 16.
- Server Actions are reachable by direct POST — authenticate inside every one.
- `redirect()` / `notFound()` throw; never swallow them in a `try/catch`.
- `useSearchParams` in a static route needs a `<Suspense>` boundary.
