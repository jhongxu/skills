---
name: core-caching
description: TanStack Query v5 caching - the query cache lifecycle, gcTime, invalidation and filters, prefetching, placeholder data, infinite queries and paginated queries.
---

# Caching

## The lifecycle

With the default `gcTime` of 5 minutes and `staleTime` of 0:

1. A new `useQuery` mounts with no cached data → hard loading state, network request.
2. Data is cached; the query becomes **active** (observed by a component).
3. When the last observer unmounts, the query becomes **inactive** — it stays cached for `gcTime`, then is garbage collected.
4. While **stale**, the query refetches in the background on mount / window focus.

## Invalidation and filters

```ts
queryClient.invalidateQueries()                          // everything
queryClient.invalidateQueries({ queryKey: ['todos'] })   // prefix match
queryClient.invalidateQueries({ queryKey: ['todos'], exact: true })
queryClient.invalidateQueries({ queryKey: ['todos'], type: 'inactive' })
```

Filter properties: `queryKey`, `exact`, `type` (`'all' | 'active' | 'inactive' | 'pending' | 'success' | 'error'`), `predicate`, `stale`, `meta`.

Related methods:

| Method | Effect |
|---|---|
| `setQueryData` | write directly to the cache |
| `getQueryData` | read from the cache |
| `removeQueries` | delete matching queries |
| `resetQueries` | reset to the initial state and refetch active ones |
| `cancelQueries` | cancel in-flight fetches |
| `prefetchQuery` | fetch and cache without subscribing |
| `ensureQueryData` | fetch only if missing (used by loaders) |
| `fetchQuery` | always fetch and replace |

## Prefetching

```ts
await queryClient.prefetchQuery({ queryKey: ['todos', id], queryFn: fetchTodo })
```

Prefetching avoids **request waterfalls**: start the next request before the user needs the data. It works in event handlers, route loaders, and hover.

With TanStack Router:

```tsx
// in the route loader
await queryClient.ensureQueryData(todosQuery)
```

## Placeholder data

Shows a UI before the real data arrives **without caching it**:

```ts
useQuery({
  queryKey: ['post', id],
  queryFn: fetchPost,
  placeholderData: (prev) => prev,           // keep the previous page
  // or
  placeholderData: { title: 'Loading…' },
})
```

`placeholderData: keepPreviousData` is the built-in helper for pagination.

`initialData` is different: it **is** cached and treated as real data (no initial fetch unless `staleTime` says otherwise).

## Infinite queries

```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects({ cursor: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})
```

- `data.pages` is the array of pages; `data.pageParams` the cursors.
- Flatten with `data.pages.flatMap(p => p.items)`.
- `fetchNextPage()` / `hasNextPage` drive the "load more" button or infinite scroll.

## Paginated queries

Two patterns:

- **Offset/page based** — keep a `page` in the query key, use `placeholderData: keepPreviousData` to avoid a flash.
- **Cursor based** — like infinite queries but replace the last page (`refetch({ pageParam: 0 })`).

<!--
Source references:
- https://tanstack.com/query/latest/docs/framework/react/guides/caching
- https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
- https://tanstack.com/query/latest/docs/framework/react/guides/filters
- https://tanstack.com/query/latest/docs/framework/react/guides/prefetching
- https://tanstack.com/query/latest/docs/framework/react/guides/placeholder-query-data
- https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
- https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries
-->
