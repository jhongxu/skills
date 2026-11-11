---
name: core-queries
description: TanStack Query v5 queries - useQuery, query keys, query functions, queryOptions, query status vs fetch status, and the important defaults.
---

# Queries

A query is a **declarative dependency on an asynchronous source of data** tied to a unique key.

```tsx
import { useQuery } from '@tanstack/react-query'

function App() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
  })
}
```

Needs a `QueryClientProvider` above it (usually in the app root).

## Query keys

An array, serializable with `JSON.stringify`, unique to the data:

```tsx
useQuery({ queryKey: ['todos'] })                    // list
useQuery({ queryKey: ['todos', todoId] })            // one item
useQuery({ queryKey: ['todos', { page }] })          // with variables
```

Keys are matched **by prefix** for invalidation and filtering — `['todos']` matches `['todos', 1]`.

## Query functions

Any function returning a promise:

```tsx
useQuery({ queryKey: ['todos'], queryFn: fetchAllTodos })
useQuery({ queryKey: ['todos', id], queryFn: () => fetchTodoById(id) })
```

- The function **must throw** (or return a rejected promise) on failure — the error is stored on `query.error`.
- The resolved value **must not be `undefined`** — that is treated as a failed query. Return `null` for "nothing".
- `fetch` does not throw on HTTP errors — throw manually:

```ts
const res = await fetch(url)
if (!res.ok) throw new Error(`HTTP ${res.status}`)
return res.json()
```

## queryOptions

Define the options in one place and reuse them with full inference:

```ts
import { queryOptions } from '@tanstack/react-query'

export function groupOptions(id: number) {
  return queryOptions({
    queryKey: ['groups', id],
    queryFn: () => fetchGroups(id),
    staleTime: 5 * 1000,
  })
}

// in a component
const query = useQuery(groupOptions(1))
```

Per-component `select` still composes:

```ts
const query = useQuery({
  ...groupOptions(1),
  select: (data) => data.groupName,   // query.data is now a string
})
```

`infiniteQueryOptions` is the equivalent for infinite queries.

## Status vs fetch status

| Field | Meaning |
|---|---|
| `status` | `pending` \| `error` \| `success` — the **data** state |
| `fetchStatus` | `fetching` \| `paused` \| `idle` — the **network** state |

Derived flags: `isPending`, `isError`, `isSuccess`, `isFetching`, `isPaused`, `isLoading` (`isPending && isFetching`).

A query can be `isSuccess` **and** `isFetching` at the same time (background refetch).

## Important defaults

These are aggressive — know them or debug for hours:

- `staleTime: 0` — cached data is stale immediately, so it refetches on mount and window focus.
- `gcTime: 5 * 60 * 1000` — unused queries are garbage-collected after 5 minutes.
- `retry: 3` — **but `0` on the server**, to keep SSR fast.
- `refetchOnWindowFocus`, `refetchOnReconnect`, `refetchOnMount` — all `true`.
- Stale queries refetch in the background when a new instance mounts or the window regains focus.

Set `staleTime` to control this:

- `staleTime: 2 * 60 * 1000` — no refetch for 2 minutes.
- `staleTime: Infinity` — never refetch due to staleness, but **manual invalidation still works**.
- `staleTime: 'static'` — never refetch, **even on manual invalidation**; `invalidateQueries()` and `refetchOn*: 'always'` are blocked. Use for data that cannot change while the app runs (feature flags fetched at boot, permissions loaded at login).

<!--
Source references:
- https://tanstack.com/query/latest/docs/framework/react/overview
- https://tanstack.com/query/latest/docs/framework/react/guides/queries
- https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
- https://tanstack.com/query/latest/docs/framework/react/guides/query-functions
- https://tanstack.com/query/latest/docs/framework/react/guides/query-options
- https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
-->
