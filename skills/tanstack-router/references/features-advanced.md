---
name: features-advanced
description: TanStack Router advanced features - Outlet, not-found handling, parallel routes, route masking, scroll restoration, document head management and static route data.
---

# Advanced Features

## Outlet

Nested routes render into an `<Outlet />`:

```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <>
      <Header />
      <Outlet />
    </>
  ),
})
```

If a route's `component` is left `undefined`, it renders an `<Outlet />` automatically — useful for layout-only routes.

## Not found errors

```tsx
import { notFound, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId)
    if (!post) throw notFound()
    return post
  },
  notFoundComponent: () => <PostNotFound />,
})
```

- The router throws a not-found error automatically when a path matches no route.
- `notFoundMode: 'fuzzy'` (default) lets the **nearest matching route** render its `notFoundComponent`; `notFoundMode: 'root'` sends it to the root route.
- The legacy `NotFoundRoute` is deprecated — use `notFound()` + `notFoundComponent`.

## Route masking

Mask the URL shown in the address bar while actually navigating elsewhere — e.g. a modal route at `/photo/5/modal` displayed as `/photos/5`:

```tsx
navigate({ to: '/photo/$id/modal', params: { id }, mask: { to: '/photos/$id', params: { id } } })
```

Also useful for hiding search params from the URL.

## Parallel routes

Render multiple routes at the same URL level (e.g. a modal slot + a main slot). Each slot is a route with its own `<Outlet />`; a `default.tsx`-style fallback handles unmatched slots.

## Scroll restoration

```tsx
const router = createRouter({
  routeTree,
  scrollRestoration: true,
  scrollToTopSelectors: ['#main-scrollable-area'],
})
```

- Hash scrolling and scroll-to-top work out of the box.
- `scrollToTopSelectors` targets nested scrollable containers (the window is always included).
- Scroll restoration remembers the position per history entry when you navigate back.

## Document head management

```tsx
import { HeadContent } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <>
      <HeadContent />
      <Outlet />
    </>
  ),
})

export const Route = createFileRoute('/posts/$postId')({
  head: () => ({ meta: [{ title: 'My Post' }] }),
})
```

The head manager dedupes `title`/`meta` tags, loads/unloads them as routes change visibility, and merges them from nested routes.

## Static route data

Attach arbitrary synchronous data to a route:

```tsx
export const Route = createFileRoute('/posts')({
  staticData: { customData: 'Hello!' },
})
```

Read it from any match via `match.staticData` (e.g. with `useMatches()`) — handy for breadcrumbs, titles and nav items.

<!--
Source references:
- https://tanstack.com/router/latest/docs/framework/react/guide/outlets
- https://tanstack.com/router/latest/docs/framework/react/guide/not-found-errors
- https://tanstack.com/router/latest/docs/framework/react/guide/route-masking
- https://tanstack.com/router/latest/docs/framework/react/guide/parallel-routes
- https://tanstack.com/router/latest/docs/framework/react/guide/scroll-restoration
- https://tanstack.com/router/latest/docs/framework/react/guide/document-head-management
- https://tanstack.com/router/latest/docs/framework/react/guide/static-route-data
-->
