---
name: core-data-loading
description: TanStack Router data loading - the route loading lifecycle, loader, beforeLoad, SWR caching, deferred loading with Await, and data mutations.
---

# Data Loading

## The loading lifecycle

On every URL/history update:

1. **Route matching (top-down)**
   - `route.params.parse`
   - `route.validateSearch`
2. **Route pre-loading (serial)**
   - `route.beforeLoad`
   - `route.onError`
3. **Route loading (parallel)**
   - `route.loader`

Loaders of all matched routes run **in parallel**, and the router renders as soon as they resolve.

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params, deps, context }) => fetchPost(params.postId),
  beforeLoad: ({ params, context }) => {
    if (!context.user) throw redirect({ to: '/login' })
  },
})
```

- `loader` receives `{ params, deps, context, location, navigate, abortController, cause, matches }`.
- `beforeLoad` runs **before** the loaders of that route and of its children; it can redirect or return context.
- `deps` lets a loader re-run when the deps change.

## SWR caching

The router keeps a long-term in-memory cache of loader results. Revisiting a route serves the cached value and revalidates in the background — the same idea as TanStack Query's `staleTime`.

```tsx
const router = createRouter({
  routeTree,
  defaultStaleTime: 30_000,
  defaultGcTime: 5 * 60_000,
})
```

`router.invalidate()` forces a reload of the current route's loaders; `router.invalidate({ id })` targets a specific route.

## Deferred loading

Return an **unawaited promise** to render the critical part first:

```tsx
import { defer, Await } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: () => {
    const slow = fetchComments()
    return defer({ post: fetchPost(), comments: slow })
  },
  component: PostComponent,
})

function PostComponent() {
  const { post, comments } = Route.useLoaderData()
  return (
    <>
      <h1>{post.title}</h1>
      <Suspense fallback={<CommentsSkeleton />}>
        <Await promise={comments}>{(data) => <Comments data={data} />}</Await>
      </Suspense>
    </>
  )
}
```

- The route renders as soon as the awaited values resolve; the deferred promise continues in the background.
- `<Await>` triggers the nearest Suspense boundary until its promise resolves; a rejected promise throws the serialized error to the nearest error boundary.

## Mutations

**The router does not manage mutation or submission state.** It only invalidates loader data and reacts to URL side effects.

For mutations use a dedicated library — **TanStack Query** is the natural fit (`jotai-query`, `trpc` and friends integrate with the router's async model):

- submission state and caching,
- local and global optimistic UI,
- automatic invalidation wiring,
- multiple in-flight mutations.

Then call `router.invalidate()` (or `queryClient.invalidateQueries()`) after a successful mutation so loaders refetch.

<!--
Source references:
- https://tanstack.com/router/latest/docs/framework/react/guide/data-loading
- https://tanstack.com/router/latest/docs/framework/react/guide/deferred-data-loading
- https://tanstack.com/router/latest/docs/framework/react/guide/data-mutations
- https://tanstack.com/router/latest/docs/framework/react/integrations/query
-->
