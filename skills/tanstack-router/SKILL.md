---
name: tanstack-router
description: TanStack Router v1 - type-safe routing for React and Solid with file-based route generation, loaders with SWR caching, typed search params, deferred loading, code splitting, and TanStack Start for full-stack apps. Use when building or migrating a TanStack Router app.
metadata:
  author: jianghongxu
  version: "2026.11.11"
  source: Generated from https://github.com/TanStack/router, scripts at https://github.com/jhongxu/skills
---

# TanStack Router

> Based on TanStack Router v1.170, generated at 2026-11-11. React and Solid; TanStack Start is stable.

## Preferences

- Prefer TypeScript over JavaScript.
- Prefer **file-based routing** over code-based routing.
- Put data fetching in route `loader`s, never in `useEffect`.
- Validate search params on the route with `validateSearch` instead of parsing them in components.
- Use `linkOptions()` for reusable navigation options so type errors surface at definition time.
- Enable `@tanstack/eslint-plugin-router` and the router devtools.
- Treat route guards as UI gating only — authorize every server function and server route on its own.

## Core

| Topic | Description | Reference |
|-------|-------------|--------|
| Concepts | Route trees, root route, `createFileRoute`, code-based routing, router context, type safety | [core-concepts](references/core-concepts.md) |
| File-Based Routing | Naming conventions, `$param`, `_pathless`, `-` excluded, `(group)`, escaping, index routes | [core-file-routing](references/core-file-routing.md) |
| Navigation | `Link`, `useNavigate`, `ToOptions`, params, typed search params, `linkOptions`, blocking | [core-navigation](references/core-navigation.md) |
| Data Loading | Loading lifecycle, `loader`, `beforeLoad`, SWR cache, deferred loading with `Await`, mutations | [core-data-loading](references/core-data-loading.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|--------|
| Performance | Code splitting, preloading, structural sharing, fine-grained selectors, ESLint plugin, devtools | [features-optimization](references/features-optimization.md) |
| Advanced | Outlet, not-found, parallel routes, route masking, scroll restoration, head management | [features-advanced](references/features-advanced.md) |
| SSR & Testing | Server rendering, hydration, framework boundaries, Vitest setup | [features-ssr](references/features-ssr.md) |
| TanStack Start | Execution model, server functions, server routes, middleware, SPA mode, ISR | [features-start](references/features-start.md) |

## Best Practices

| Topic | Description | Reference |
|-------|-------------|--------|
| Habits | Type safety, guards vs authorization, search params as state, debugging, migration | [best-practices](references/best-practices.md) |

## Quick Reference

### Route

```tsx
// src/routes/posts.$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  validateSearch: (s: { page?: number }) => ({ page: Number(s.page ?? 1) }),
  loader: ({ params }) => fetchPost(params.postId),
  component: PostComponent,
})
```

### Router

```tsx
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})
```

### Link & navigation

```tsx
<Link to="/posts/$postId" params={{ postId: '1' }} search={{ page: 2 }} preload="intent">
  Post
</Link>
```

### Deferred data

```tsx
const { post, comments } = Route.useLoaderData()
<Await promise={comments}>{(data) => <Comments data={data} />}</Await>
```

### Things that bite

- `createFileRoute('/path')` — the path is **auto-managed**; don't hand-edit it.
- In code-based routing, every child route needs `getParentRoute`.
- `loader`s run on **both** server and client in TanStack Start — never put secrets in them.
- A route guard is **not** an authorization boundary.
- `select` returning a new object each call re-renders every time.
- Don't mix in Next.js/Remix/React Router APIs (`app/layout.tsx`, `getServerSideProps`, `react-router-dom`).
