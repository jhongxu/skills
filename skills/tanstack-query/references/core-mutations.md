---
name: core-mutations
description: TanStack Query v5 mutations - useMutation, mutation lifecycle callbacks, invalidating queries from mutations, and optimistic updates.
---

# Mutations

Mutations are for **writes** — create/update/delete plus server side-effects.

```tsx
const mutation = useMutation({
  mutationFn: (newTodo: Todo) => api.createTodo(newTodo),
  onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})

mutation.mutate({ title: 'Hi' })
```

## States

A mutation is in exactly one of:

| State | Meaning |
|---|---|
| `isIdle` / `'idle'` | fresh or reset |
| `isPending` / `'pending'` | running |
| `isError` / `'error'` | failed |
| `isSuccess` / `'success'` | succeeded, `mutation.data` available |

Also exposed: `isPaused`, `error`, `variables`, `data`, `failureCount`, `reset()`.

## Lifecycle callbacks

```tsx
useMutation({
  mutationFn,
  onMutate: (vars) => { /* before the request */ },
  onSuccess: (data, vars) => {},
  onError: (err, vars) => {},
  onSettled: (data, err, vars) => {},
})
```

`onSettled` runs in both cases — the usual place for `invalidateQueries`.

## Invalidating from mutations

```tsx
const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: updateTodo,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

Invalidation **marks queries stale** (overriding `staleTime`) and **refetches them in the background** if they are currently mounted.

For more targeted updates, write to the cache directly:

```ts
queryClient.setQueryData(['todos', id], (old) => ({ ...old, title }))
```

## Optimistic updates

Two ways:

**1. Via the UI** — use `mutation.variables` (the mutation's arguments) while pending:

```tsx
const { isPending, variables } = useMutation({ mutationFn: addTodo })

<ul>
  {todos.map(t => <li key={t.id}>{t.text}</li>)}
  {isPending && <li style={{ opacity: 0.5 }}>{variables.title}</li>}
</ul>
```

**2. Via the cache** — update the cache in `onMutate`, roll back in `onError`:

```tsx
const mutation = useMutation({
  mutationFn: addTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previous = queryClient.getQueryData(['todos'])
    queryClient.setQueryData(['todos'], (old: Todo[] = []) => [...old, newTodo])
    return { previous }        // returned value is passed to onError/onSettled
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(['todos'], context?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

⚠️ `onMutate` must **await** `cancelQueries` before reading the cache, or a concurrent refetch can overwrite your optimistic value.

## Mutation scope

`useMutation({ scope: { id } })` serializes mutations sharing an id — useful for "last write wins" on the same resource.

<!--
Source references:
- https://tanstack.com/query/latest/docs/framework/react/guides/mutations
- https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
- https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations
- https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
-->
