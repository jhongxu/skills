---
name: core-reducer-context
description: useReducer, creating and reading context with createContext/useContext, and extracting reusable logic into custom hooks.
---

# Reducer, Context & Custom Hooks

## useReducer

```tsx
const [state, dispatch] = useReducer(reducer, initialArg, init?)
```

Move complex state transitions out of the component into a pure reducer:

```tsx
type Action = { type: 'added'; text: string } | { type: 'deleted'; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'added': return { ...state, items: [...state.items, action.text] }
    case 'deleted': return { ...state, items: state.items.filter(i => i.id !== action.id) }
    default: throw new Error('unknown action')
  }
}

const [state, dispatch] = useReducer(reducer, initialState)
```

- The reducer must be **pure** — no side effects, no mutation of the incoming state.
- `dispatch` is **stable** across renders; omit it from effect dependencies.
- `init` is an optional initializer: `useReducer(reducer, initialArg, init)` sets the initial state to `init(initialArg)`.
- Actions describe *what happened*, not *how to set state* — so the reducer owns all the transition logic.

Use a reducer when: state updates are numerous and conditional, multiple components need the same logic, or the update depends on the previous state in complex ways.

## Context

Context lets a component read data from an ancestor without threading props through every level.

```tsx
// context.ts
import { createContext, useContext } from 'react'

export const ThemeContext = createContext('light')   // default value

export function useTheme() {
  return useContext(ThemeContext)
}

// provider.tsx — 'use client' when used in a Server Component tree
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext value="dark">{children}</ThemeContext>
}
```

- In React 19, `<Context value={...}>` can be used **directly as a provider** — `<Context.Provider>` still works but is no longer required.
- `useContext` must be called at the top level of a component.
- The provider must be **above** the consumer. A provider rendered by the same component that calls `useContext` has no effect on it.
- Context is **not reactive per-field**: React re-renders every consumer when the provider's `value` changes (compared with `Object.is`). `memo` on the consumer does not stop that — split contexts by update frequency if the value changes often.
- Provider values should be stable (memoized) if they are objects.

## Custom hooks

Extract stateful logic into a reusable hook:

```tsx
function useOnlineStatus() {
  const [online, setOnline] = useState(true)
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}
```

- A custom hook is a **shared stateful logic**, not shared state: each caller gets its own independent state.
- Name it `useXxx`. Hooks can call other hooks.
- Two components calling the same custom hook do **not** share state — to share state, lift it to a common parent or use context.
- Custom hooks may return anything: a value, a tuple, or several values.

## Scaling up: reducer + context

The canonical pattern for shared complex state:

1. Put the state and reducer in one module.
2. Create a context for the **dispatch** function (stable, never changes) and optionally another for the state.
3. Provide both from a provider component at the top of the tree.
4. Consume via small custom hooks.

```tsx
const StateContext = createContext<State | null>(null)
const DispatchContext = createContext<Dispatch | null>(null)
```

Keeping dispatch and state in separate contexts means consumers that only dispatch do not re-render when the state changes.

<!--
Source references:
- https://react.dev/reference/react/useReducer
- https://react.dev/learn/extracting-state-logic-into-a-reducer
- https://react.dev/learn/passing-data-deeply-with-context
- https://react.dev/learn/scaling-up-with-reducer-and-context
- https://react.dev/learn/reusing-logic-with-custom-hooks
- https://react.dev/reference/react/createContext
- https://react.dev/reference/react/useContext
-->
