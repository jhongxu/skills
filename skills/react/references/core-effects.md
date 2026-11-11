---
name: core-effects
description: useEffect semantics, dependency rules, Effect lifecycle, when not to use an Effect, separating events from Effects, useLayoutEffect and useEffectEvent.
---

# Effects

`useEffect` lets a component synchronize with something **outside** React (a network connection, a DOM widget, a third-party library). It runs **after** the component is rendered and committed to the DOM.

```tsx
useEffect(() => {
  // setup
  return () => { /* cleanup */ }
}, [dep1, dep2])
```

## You probably do not need an Effect

Effects are an escape hatch. Before writing one, check whether the logic belongs somewhere else:

| Goal | Do this instead |
|---|---|
| Transform data for display | Compute it **during render** |
| Handle a user event | Put the logic in the **event handler** |
| Reset state when a prop changes | **Adjust state during render** (compare prev prop) |
| Fetch data on mount | Framework/route loader, or `use`/Suspense |
| Notify a parent | **Call the callback during render** or in an event handler |

Two official escape hatches when an Effect really is needed:
1. **Synchronizing with an external system** (network, browser API, third-party widget).
2. **Controlling a non-React widget** (e.g. a `<video>` playback API).

**Do not** use an Effect to "reset" state of a child — use a `key` instead.

## Dependencies

- The dependency list **describes** your code; it is not a choice. Every reactive value (props, state, and anything declared in the component body) used inside the Effect must be listed.
- **To change the dependencies, change the code** — move the value out of the component (module scope, or into the Effect body) so it is no longer reactive.
- Never **suppress** the `exhaustive-deps` lint. Suppressing it makes React reuse a stale closure and produces bugs that are very hard to trace. Restructure instead.
- **Objects and functions** are new on every render, so depending on them re-runs the Effect every render. Move them inside the Effect, or memoize them.
- Omit dependencies that React guarantees are stable: `setState`/`dispatch` functions, and the `startTransition`/`dispatchAction` functions returned by `useTransition`/`useActionState`.
- An Effect with `[]` runs after the first render and cleans up on unmount only. An Effect with **no** dependency array runs after every commit.

## Effect lifecycle

1. **Setup** runs after the DOM is committed.
2. **Cleanup** runs before the next setup (with the *old* values) and when the component unmounts.
3. In **StrictMode** (development), React runs setup → cleanup → setup once more on mount, to surface missing cleanups.

Every Effect that subscribes to something must return a cleanup that unsubscribes it.

## Separating Events from Effects

Effects should not *respond* to user actions — event handlers should. If an Effect only runs in response to a prop/state change that a user triggered, move that logic into the event handler.

```tsx
// ❌ effect used to react to a click
useEffect(() => { if (submitted) sendToServer(data) }, [submitted])

// ✅
function handleSubmit() { sendToServer(data) }
```

When an Effect genuinely needs to call a callback that itself changes state, use **`useEffectEvent`** (React 19.2+):

```tsx
const onConnected = useEffectEvent((roomId: string) => { /* uses latest props/state */ })

useEffect(() => {
  const conn = connect(roomId, onConnected)   // onConnected is NOT a dependency
  return () => conn.disconnect()
}, [roomId])
```

`useEffectEvent` returns a stable function that always sees the latest props and state. It **must not** be in the dependency list — it is not reactive. Use it only for logic that should *not* re-trigger the Effect.

## useLayoutEffect

`useLayoutEffect` fires **before the browser repaints**, so it is for measuring and adjusting layout to avoid a visual jump. It is slower than `useEffect` — prefer `useEffect` whenever possible.

```tsx
useLayoutEffect(() => {
  const { height } = listRef.current!.getBoundingClientRect()
  setHeight(height)     // re-render before paint
}, [items])
```

Server rendering warns about it — use it only for client-only measurement.

## `useEffectEvent` caveats

- Call it at the top level of a component.
- It is **not** reactive: reading a value inside it does not subscribe the component.
- Do not use it to silence the dependency linter — only for logic that genuinely should not re-run the Effect.
- `useInsertionEffect` exists for CSS-in-JS libraries to inject styles before layout; you almost never need it directly.

<!--
Source references:
- https://react.dev/reference/react/useEffect
- https://react.dev/learn/you-might-not-need-an-effect
- https://react.dev/learn/synchronizing-with-effects
- https://react.dev/learn/removing-effect-dependencies
- https://react.dev/learn/separating-events-from-effects
- https://react.dev/learn/lifecycle-of-reactive-effects
- https://react.dev/reference/react/useLayoutEffect
- https://react.dev/reference/react/useEffectEvent
-->
