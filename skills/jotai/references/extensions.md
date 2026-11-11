---
name: extensions
description: Jotai ecosystem extensions - jotai-effect, jotai-immer, jotai-optics, jotai-cache, jotai-redux, jotai-scope, jotai-query, jotai-trpc, jotai-urql, jotai-relay, jotai-xstate, jotai-location and jotai-form.
---

# Extensions

Official packages in the `jotai` scope, each installed separately.

| Package | Purpose |
|---|---|
| `jotai-effect` | reactive side effects at the store level |
| `jotai-immer` | mutate state with Immer drafts |
| `jotai-optics` | focus into nested state with optics |
| `jotai-cache` | cache async atom results |
| `jotai-redux` | two-way bind a Redux store to atoms |
| `jotai-scope` | reuse the same atoms in different subtrees without sharing state |
| `jotai-query` | TanStack Query integration |
| `jotai-trpc` | tRPC integration |
| `jotai-urql` | urql integration |
| `jotai-relay` | Relay integration |
| `jotai-xstate` | XState integration |
| `jotai-valtio` | Valtio interop |
| `jotai-location` | browser location state |
| `jotai-form` | form state |
| `jotai-devtools` | devtools |

## jotai-effect

```ts
import { observe } from 'jotai-effect'

const unobserve = observe((get, set) => {
  set(logAtom, `someAtom changed: ${get(someAtom)}`)
})
```

`observe` mounts an effect on a store — global side effects without a component. The effect returns a **cleanup** function. Use `atomEffect` / `withAtomEffect` when you don't have direct access to the store object.

## jotai-immer

```ts
import { atomWithImmer, withImmer } from 'jotai-immer'

const countAtom = atomWithImmer({ value: 0 })
setCountAtom((draft) => { draft.value++ })
```

`atomWithImmer` takes a write function of the form `(get, set, update: (draft) => void)`. `withImmer` gives an existing atom an Immer-based write function.

## jotai-optics

```ts
import { focusAtom } from 'jotai-optics'

const baseAtom = atom({ a: 5 })
const derivedAtom = focusAtom(baseAtom, (optic) => optic.prop('a'))
```

`focusAtom` creates a **writable** derived atom zoomed into part of the base atom — updating it updates the base.

## jotai-cache

```ts
import { atomWithCache } from 'jotai-cache'

const cachedAtom = atomWithCache(read)
```

Holds only the current value (not a history) — useful to avoid duplicate network requests from async atoms.

## jotai-redux

```ts
import { atomWithStore } from 'jotai-redux'

const reduxAtom = atomWithStore(reduxStore)
```

Two-way binding between a Redux store and an atom.

## jotai-scope

`<ScopeProvider>` lets you reuse the **same atom configs** in different parts of the tree **without sharing state**, while still reading from the parent store — the missing half of what `Provider` gives you.

## Data-fetching integrations

`jotai-query`, `jotai-trpc`, `jotai-urql` and `jotai-relay` integrate async clients with Jotai's async atoms, so the Suspense model keeps working.

<!--
Source references:
- https://jotai.org/docs/extensions/effect
- https://jotai.org/docs/extensions/immer
- https://jotai.org/docs/extensions/optics
- https://jotai.org/docs/extensions/cache
- https://jotai.org/docs/extensions/redux
- https://jotai.org/docs/extensions/scope
- https://jotai.org/docs/extensions/query
- https://jotai.org/docs/extensions/trpc
-->
