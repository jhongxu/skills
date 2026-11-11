---
name: tanstack-query
description: TanStack Query v5 - server-state management for React with caching, invalidation, mutations, optimistic updates, infinite queries, Suspense hooks, SSR hydration and persistence. Use when fetching, caching or mutating server data in React.
metadata:
  author: jianghongxu
  version: "2026.11.11"
  source: Generated from https://github.com/TanStack/query, scripts at https://github.com/jhongxu/skills
---

# TanStack Query

> Based on TanStack Query v5.107, generated at 2026-11-11. React (also Solid, Svelte, Vue, Angular).

## Preferences

- Prefer TypeScript over JavaScript.
- Define query keys and options in a shared `queryOptions` factory per resource.
- Keep `queryFn` a pure fetch — writes go through `useMutation`.
- Invalidate narrowly (`['todos', id]`) rather than invalidating everything.
- Use `placeholderData: keepPreviousData` for pagination instead of `keepPreviousData: true` (v4 API).
- Enable the devtools in development.
- Disable retries in tests.

## Core

| Topic | Description | Reference |
|-------|-------------|--------|
| Queries | `useQuery`, query keys, query functions, `queryOptions`, status vs fetch status, defaults | [core-queries](references/core-queries.md) |
| Mutations | `useMutation`, lifecycle callbacks, invalidation from mutations, optimistic updates | [core-mutations](references/core-mutations.md) |
| Caching | Cache lifecycle, `gcTime`/`staleTime`, filters, prefetching, placeholder data, infinite & paginated queries | [core-caching](references/core-caching.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|--------|
| Suspense & SSR | `useSuspenseQuery`, `dehydrate`/`HydrationBoundary`, Server Components, request waterfalls | [features-suspense-ssr](references/features-suspense-ssr.md) |
| Optimization & Tooling | Structural sharing, `select`, `notifyOnChangeProps`, devtools, cache persistence | [features-optimization](references/features-optimization.md) |

## Best Practices

| Topic | Description | Reference |
|-------|-------------|--------|
| Habits | Server vs client state, retries, network mode, polling, TypeScript, testing | [best-practices](references/best-practices.md) |

## Quick Reference

### Query

```tsx
const { data, isPending, isError } = useQuery({
  queryKey: ['todos', filter],
  queryFn: () => api.getTodos(filter),
  staleTime: 30_000,
})
```

### Shared options

```ts
export const todoOptions = (id: string) => queryOptions({
  queryKey: ['todos', id],
  queryFn: () => api.getTodo(id),
})
```

### Mutation

```tsx
const queryClient = useQueryClient()

const { mutate, isPending } = useMutation({
  mutationFn: api.createTodo,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})
```

### Optimistic update

```tsx
useMutation({
  mutationFn: api.addTodo,
  onMutate: async (todo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previous = queryClient.getQueryData(['todos'])
    queryClient.setQueryData(['todos'], (old: Todo[] = []) => [...old, todo])
    return { previous }
  },
  onError: (_e, _v, ctx) => queryClient.setQueryData(['todos'], ctx?.previous),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})
```

### Things that bite

- `queryFn` must **throw** on failure and must not resolve `undefined` (use `null`).
- `status` is `pending`/`error`/`success` (v5 renamed `loading` → `pending`).
- `staleTime: Infinity` still allows manual invalidation; `staleTime: 'static'` does not.
- Retries default to **0 on the server**.
- `onMutate` must `await cancelQueries` before touching the cache.
- `select` returning a new object re-renders on every fetch.
