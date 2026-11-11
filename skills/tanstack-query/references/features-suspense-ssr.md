---
name: features-suspense-ssr
description: TanStack Query v5 suspense hooks, server rendering and hydration with dehydrate/HydrationBoundary, advanced SSR with Server Components, and avoiding request waterfalls.
---

# Suspense & SSR

## Suspense hooks

```tsx
import { useSuspenseQuery, useSuspenseInfiniteQuery, useSuspenseQueries } from '@tanstack/react-query'

const { data } = useSuspenseQuery({ queryKey, queryFn })
```

- `status` and `error` are no longer needed — `<Suspense>` handles loading and error boundaries handle errors.
- `data` is guaranteed to be defined (great for TypeScript).
- Set `throwOnError: true` on a mutation to propagate errors to the nearest error boundary.
- **Resetting error boundaries**: React only resets an error boundary when the boundary itself re-renders; changing the `queryKey` does not reset it — pass a `resetKey` or remount manually.

## Server rendering & hydration

```tsx
// server
const queryClient = new QueryClient()
await queryClient.prefetchQuery({ queryKey: ['todos'], queryFn: fetchTodos })
const dehydratedState = dehydrate(queryClient)
```

```tsx
// client
<HydrationBoundary state={dehydratedState}>
  <App />
</HydrationBoundary>
```

- `dehydrate` serializes the cache, `hydrate` restores it.
- Pass the dehydrated state from the server to the client — through the router loader, a stream, or a global.

### With TanStack Router

```tsx
// route loader
export const Route = createFileRoute('/todos')({
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(todosQuery)
  },
})
```

## Advanced SSR (Server Components / Next.js App Router)

Server Components are "just another framework loader": they run only on the server, on the initial view **and** on page transitions.

The pattern:

1. In a Server Component, `await queryClient.prefetchQuery(...)` before rendering.
2. Wrap the client app in `<HydrationBoundary state={dehydrate(queryClient)}>`.
3. In the client component, `useQuery` picks up the hydrated data — no second fetch.

⚠️ Watch out for terminology: **Server Component** ≠ server vs client. Client Components can also run during the initial server render. Think "loader phase" (server) vs "application phase" (server during SSR and/or browser).

## Request waterfalls

The biggest performance footgun: a chain of requests where each starts only after the previous finishes.

```
await getUser()      // 200ms
await getPosts()     // 200ms  ← could have run in parallel
await getComments()  // 200ms
```

Ways to avoid them:

- **Fetch in parallel** — start independent requests before awaiting.
- **Preload in the router** — `ensureQueryData` in a route loader.
- **Prefetch on intent** — prefetch on hover.
- **Restructure the API** — return what the next request needs in one round trip.

Server rendering needs the data **before** the HTML is sent, so waterfalls hurt the TTFB most.

<!--
Source references:
- https://tanstack.com/query/latest/docs/framework/react/guides/suspense
- https://tanstack.com/query/latest/docs/framework/react/guides/ssr
- https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
- https://tanstack.com/query/latest/docs/framework/react/guides/request-waterfalls
-->
