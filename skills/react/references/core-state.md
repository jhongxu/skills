---
name: core-state
description: useState, state as a snapshot, immutable updates, functional updaters, batching, and choosing a state structure.
---

# State

## useState

```tsx
const [state, setState] = useState(initialState)
```

- Call it **at the top level of a component** (or a custom hook). Not in loops, conditions, or nested functions.
- Convention: `[something, setSomething]`.
- `initialState` may be a value **or a function**. A function is treated as a *lazy initializer* — React calls it once on mount and uses its return value. That is how you avoid re-creating an expensive object on every render.

```tsx
const [items, setItems] = useState(() => expensiveInit())
```

- The value returned by `useState` is only used on the first render; afterwards the stored state is used.

## State is a snapshot

Setting state does **not** mutate the variable you already have — it requests a re-render, and the new render produces a new value. The state variable in a given render is frozen for that render.

```tsx
function Counter() {
  const [count, setCount] = useState(0)
  return (
    <>
      <h1>{count}</h1>          {/* always the value of THIS render */}
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(c => c + 1)}>+ (functional)</button>
    </>
  )
}
```

Three `setCount(count + 1)` calls in one handler all queue `count + 1` computed from the **same** stale snapshot → the counter advances by 1. Use the **functional updater** `setCount(c => c + 1)` when the next value depends on the previous one.

Event handlers from a render also close over that render's props and state — they don't see later values. Use `useEffectEvent` (see `core-effects`) when a handler must read the latest value without re-triggering an effect.

## Updating objects and arrays immutably

State is treated as immutable. Always create a new object/array:

```tsx
// object
setUser({ ...user, name: 'Ada' })

// array
setItems([...items, newItem])                 // append
setItems(items.filter(i => i.id !== id))      // remove
setItems(items.map(i => (i.id === id ? { ...i, done: true } : i)))

// nested
setForm({ ...form, user: { ...form.user, email } })
```

Mutating in place (`items.push(x)`, `user.name = 'x'`) does not trigger a re-render and corrupts React's previous-state snapshot.

## Queueing state updates

- Updates are **batched**: all `set` calls in the same event handler are applied together in one re-render.
- React always applies updates **in order**, and the last one wins for the same variable.
- Updating the *same* state variable twice in one handler replaces the first update — that is why the functional updater matters.
- Updating *different* variables in one handler is fine and produces a single re-render.

## Choosing the state structure

Structuring state well removes whole classes of bugs. Checklist:

- **Is it redundant?** If a value can be computed from existing props/state, do not store it — compute it during render.
  ```tsx
  // ❌ two sources of truth
  const [fullName, setFullName] = useState('')
  const [first, setFirst] = useState('')
  // ✅ one source
  const fullName = `${first} ${last}`
  ```
- **Is it a group that always changes together?** Keep it in one object (`{width, height}`), not three separate variables.
- **Is it derived from props?** Don't mirror props into state — use the prop directly. (Syncing props → state via an effect is an anti-pattern; "adjusting state when a prop changes" is done during render instead.)
- **Is it a list of objects?** Keep the identifying `id` inside each object, so updating one item is easy.
- **Avoid deeply nested state** — deeply nested objects are hard to update immutably. Flatten them.

## Resetting state

To reset a component's state, give it a **different `key`** — React remounts it with fresh state:

```tsx
<Profile key={userId} />
```

State is preserved by **position** in the tree: the same component at the same position keeps its state; moving it to a different parent resets it (unless you use `<Activity>`).

<!--
Source references:
- https://react.dev/learn/state-a-components-memory
- https://react.dev/learn/state-as-a-snapshot
- https://react.dev/learn/updating-objects-in-state
- https://react.dev/learn/updating-arrays-in-state
- https://react.dev/learn/queueing-a-series-of-state-updates
- https://react.dev/learn/choosing-the-state-structure
- https://react.dev/reference/react/useState
-->
