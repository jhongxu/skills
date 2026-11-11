---
name: advanced-transitions
description: useTransition, startTransition, Actions, useDeferredValue, useActionState, useOptimistic, and the use hook.
---

# Transitions, Actions & Async State

React distinguishes **urgent** updates (typing in an input) from **non-blocking** updates (rendering a big list after a filter). Transitions mark the latter.

## useTransition

```tsx
const [isPending, startTransition] = useTransition()

function selectTab(next: string) {
  startTransition(() => setTab(next))
}
```

- Everything set **synchronously inside** the action becomes part of the Transition.
- `isPending` is true while the Transition renders.
- A Transition update is **interruptible**: a new urgent update (typing) cancels the pending Transition render.
- **State updates after an `await` are not part of the Transition** — wrap them in another `startTransition`.
- Transitions **cannot control text inputs** — the value of an input must update urgently.
- Use the standalone `startTransition` (imported from `react`) when you are outside a component.

```tsx
startTransition(async () => {
  const data = await fetchData()
  startTransition(() => setData(data))   // ← needs its own startTransition
})
```

## useDeferredValue

Defer a value so a slower render can happen in the background:

```tsx
const deferredQuery = useDeferredValue(query)
const results = useMemo(() => search(deferredQuery), [deferredQuery])
```

- The component re-renders immediately with the **old** value, then again in the background with the new one.
- Pass the deferred value to the expensive child. Never debounce the input itself if you can avoid it — debouncing makes the whole app feel laggy, deferring only slows the heavy part.
- Inside a Transition, `useDeferredValue` returns the new value immediately and does not spawn a deferred render.

## Actions

A function called inside `startTransition` is an **Action**. By convention, name it `action` or suffix it with `Action`.

Actions can be passed down as props (`<form action={submitAction}>`) so a child can trigger a parent-side transition.

## useActionState

Manages the state of an async Action, including pending state and errors:

```tsx
const [state, dispatchAction, isPending] = useActionState(async (prevState, formData) => {
  const result = await submit(formData)
  return { result, error: null }
}, { error: null })
```

- `reducerAction` may be **async** and may perform side effects — unlike a `useReducer` reducer.
- `dispatchAction` must be called **inside an Action** (inside `startTransition` or as an `action` prop). Calling it elsewhere logs an error in development.
- Multiple calls are queued and executed **sequentially**, each receiving the previous result as `previousState`.
- `dispatchAction` has a stable identity — omit it from effect dependencies.
- The optional third argument `permalink` enables progressive enhancement with Server Functions: if the form is submitted before the JS bundle loads, the browser navigates to that URL instead.
- With Server Functions, `initialState` must be **serializable**.
- If `dispatchAction` throws, React cancels queued actions and the nearest Error Boundary handles it.

## useOptimistic

Show an optimistic result while an Action is in flight:

```tsx
const [optimisticItems, addOptimistic] = useOptimistic(
  items,
  (state, newItem) => [...state, newItem],
)

async function submit(formData: FormData) {
  addOptimistic(newItem)              // shown immediately
  await startTransition(async () => { await save(formData) })
}
```

- The optimistic state applies only while a Transition is pending; when the real state arrives, the optimistic layer is dropped.
- The reducer must be **pure** and must return a state based on the input state plus the optimistic update.

## The `use` hook

```tsx
const data = use(promise)          // read a promise or context
const ctx = use(ThemeContext)      // read context conditionally
```

- `use` can be called **inside conditions and loops** — unlike other Hooks.
- When given a promise, `use` suspends until it resolves; wrap it in `<Suspense>`.
- When given a context, `use` reads it — but only in a Server Component or inside a Suspense-enabled boundary.
- `use` does not cache the promise: create it outside the component (or in a `cache()`-wrapped function on the server) to avoid refetching on every render.

<!--
Source references:
- https://react.dev/reference/react/useTransition
- https://react.dev/reference/react/startTransition
- https://react.dev/reference/react/useDeferredValue
- https://react.dev/reference/react/useActionState
- https://react.dev/reference/react/useOptimistic
- https://react.dev/reference/react/use
-->
