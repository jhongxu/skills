---
name: features-optimization
description: TanStack Query v5 render optimizations - structural sharing, select, notifyOnChangeProps, the devtools, and persisting the query cache.
---

# Render Optimizations & Tooling

## Structural sharing

TanStack Query keeps as many references as possible between re-renders: if a fetched object is unchanged, the original reference is kept; if only part changed, only that part is replaced.

- Only works for **JSON-compatible** data returned by `queryFn`.
- Can be disabled with `structuralSharing: false`.

## Fine-grained subscriptions

```tsx
const name = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (data) => data.filter((t) => !t.done),
})
```

`select` runs on every fetch and its result replaces `data` in this component only. Return the smallest slice you need.

⚠️ If `select` returns a **new object** each time, the component re-renders on every fetch. Return primitives, or memoize the selector.

## notifyOnChangeProps

By default a component re-renders when the tracked properties it uses change. `notifyOnChangeProps: 'all' | 'tracked' | 'none'` controls the granularity.

## Refetch helpers

```tsx
const query = useQuery({ queryKey, queryFn })

query.refetch()                 // refetch now
queryClient.refetchQueries({ queryKey })   // refetch a set
```

## Devtools

```sh
npm install -D @tanstack/react-query-devtools
```

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<ReactQueryDevtools initialIsOpen={false} />
```

Shows every query and mutation, their state, data, and lets you refetch or invalidate them live. Browser extensions are also available for Chrome/Firefox/Edge.

## Persisting the cache

```sh
npm install @tanstack/query-persist-client-core
```

```ts
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const persister = createSyncStoragePersister({ storage: window.localStorage })

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24,
  buster: 'v1',
})
```

- Async storages (IndexedDB, AsyncStorage) use `createAsyncStoragePersister`.
- ⚠️ Pass an explicit `gcTime` to the `QueryClient` for hydration — otherwise the default 5-minute GC discards the persisted cache.
- `buster` invalidates persisted data when your app's data shape changes.

<!--
Source references:
- https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations
- https://tanstack.com/query/latest/docs/framework/react/devtools
- https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient
- https://tanstack.com/query/latest/docs/framework/react/plugins/createSyncStoragePersister
-->
