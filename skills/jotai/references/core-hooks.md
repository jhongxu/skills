---
name: core-hooks
description: Jotai hooks - useAtom, useAtomValue, useSetAtom, useAtomValueRaw, useAtomValueRawSync, and the Provider / store model.
---

# Hooks & Stores

## Choosing a hook

| Hook | Use when |
|---|---|
| `useAtom(atom)` | read **and** write — returns `[value, setValue]` like `useState` |
| `useAtomValue(atom)` | read only |
| `useSetAtom(atom)` | write only — **does not re-render** when the atom changes |
| `useAtomValueRaw(atom)` | read an async atom **without suspending** |
| `useAtomValueRawSync(atom)` | same, but never misses an update |

```ts
const [count, setCount] = useAtom(countAtom)
const count = useAtomValue(countAtom)
const setCount = useSetAtom(countAtom)
```

`useSetAtom` is the one to reach for in event handlers that only mutate state — the component does not subscribe to the value, so it does not re-render.

`useAtomValueRaw` / `useAtomValueRawSync` (new in v3) let you read the raw promise of an async atom and handle loading/error yourself instead of suspending.

## Provider & stores

Atom **values** live in a store. A `Provider` supplies one to a subtree.

```tsx
import { Provider, createStore } from 'jotai'

const store = createStore()

<Provider store={store}>
  <App />
</Provider>
```

- Without a `Provider`, Jotai runs in **provider-less mode** using the default store (`getDefaultStore()`).
- Providers can be **nested** — each subtree gets its own state, like React Context.
- Use a Provider to: give a subtree different state, inject initial values, or **reset everything by remounting**.

### Store API

```ts
const store = createStore()

store.get(atom)
store.set(atom, value)
const unsub = store.sub(atom, () => { /* changed */ })
```

`sub` returns an unsubscribe function — call it when done.

## Using a store outside React

```ts
import { getDefaultStore } from 'jotai'

const store = getDefaultStore()
store.get(countAtom)
store.set(countAtom, 1)
```

For the store behind a specific `Provider`, keep a reference to the `createStore()` result and pass it as the `store` prop.

## Performance rules

- **Observed atoms re-render their subscribers.** Split state into small atoms so only the components that read them re-render.
- **Do the heavy computation outside render** — in a write function (an "action") or in a derived atom over already-computed data.
- Keep components small; a component subscribed to a big atom re-renders on every change of it.
- Use `useSetAtom` for write-only actions to avoid subscribing unnecessarily.

<!--
Source references:
- https://jotai.org/docs/core/use-atom
- https://jotai.org/docs/core/provider
- https://jotai.org/docs/core/store
- https://jotai.org/docs/guides/performance
- https://jotai.org/docs/guides/using-store-outside-react
-->
