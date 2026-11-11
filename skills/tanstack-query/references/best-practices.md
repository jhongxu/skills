---
name: best-practices
description: TanStack Query v5 best practices - server state vs client state, retries, network mode, polling, focus refetching, TypeScript typing and testing.
---

# Best Practices

## Server state vs client state

TanStack Query manages **server state** — data that lives on a remote server, is fetched asynchronously, and is owned by someone else.

It is **not** a client-state library. After moving async data to Query, the remaining global client state is usually tiny; for genuinely synchronous app state (a design canvas, an editor) use a client-state library alongside it — they compose fine.

## Retries

```ts
retry: 3                // default
retry: false            // no retries
retry: (failureCount, error) => error.status >= 500
```

Retries default to **0 on the server** so SSR stays fast. Disable retries for idempotency-sensitive mutations.

## Network mode

```ts
networkMode: 'online'   // default — don't fire without a connection
networkMode: 'always'   // always fire, even offline
networkMode: 'paused'   // queue until online
```

`isPaused` tells you a request is queued rather than running.

## Polling and focus

```ts
refetchInterval: 5000          // poll
refetchIntervalInBackground: false   // stop polling when the tab is hidden (default)
refetchOnWindowFocus: false    // don't refetch when the user comes back
refetchOnReconnect: true       // refetch when the network returns
```

Long `refetchInterval` values keep hitting the server — prefer a server-side subscription (SSE/WebSocket) for live data.

## TypeScript

```ts
// infer the data type from the query function
const query = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
query.data        // typed

// or annotate explicitly
useQuery<Todo[]>({ queryKey: ['todos'], queryFn: fetchTodos })
```

Use `queryOptions` to define options once and keep inference everywhere.

## Testing

```tsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

render(
  <QueryClientProvider client={queryClient}>
    <Component />
  </QueryClientProvider>,
)
```

- Disable retries in tests so failures surface immediately.
- Seed the cache with `queryClient.setQueryData(...)` instead of mocking the network.
- Use `waitFor` / `findBy*` for async assertions.

## Rules of thumb

- Put the query key in a shared `queryOptions` factory so keys stay consistent.
- Keep `queryFn` a pure fetch — no side effects; use mutations for writes.
- Invalidate **narrowly**: `['todos', id]` beats `['todos']`.
- Never `await queryClient.invalidateQueries()` inside `onMutate` — it cancels your optimistic update.
- Prefetch on intent to kill request waterfalls.

<!--
Source references:
- https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state
- https://tanstack.com/query/latest/docs/framework/react/guides/query-retries
- https://tanstack.com/query/latest/docs/framework/react/guides/network-mode
- https://tanstack.com/query/latest/docs/framework/react/guides/polling
- https://tanstack.com/query/latest/docs/framework/react/guides/window-focus-refetching
- https://tanstack.com/query/latest/docs/framework/react/typescript
- https://tanstack.com/query/latest/docs/framework/react/guides/testing
-->
