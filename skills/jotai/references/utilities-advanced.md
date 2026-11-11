---
name: utilities-advanced
description: Jotai utils - atomWithLazy, unwrap, callback, SSR helpers, atomWithObservable, and the resettable/lazy patterns.
---

# Advanced Utilities

## atomWithLazy

```ts
import { atomWithLazy } from 'jotai/utils'

const imageDataAtom = atomWithLazy(() => initializeExpensiveImage())
```

Primitive atoms must bind their initial value at definition time. `atomWithLazy` postpones the computation until the atom is **first used in a store** — useful when the value is expensive or not available at module load.

## unwrap

```ts
import { unwrap } from 'jotai/utils'

const syncAtom = unwrap(asyncAtom)
const withPrev = unwrap(asyncAtom, (prev) => prev)
```

Turns an async atom into a synchronous one so it can be derived from. Returns `undefined` (or your fallback) while pending; **errors are not caught**.

## atomWithObservable

```ts
import { atomWithObservable } from 'jotai/utils'

const timerAtom = atomWithObservable(() => interval(1000))
```

## callback / SSR helpers

```ts
import { callback } from 'jotai/utils'
```

`callback` creates a stable callback that writes to an atom — handy for event handlers that should not re-subscribe.

For server rendering, atoms are serialized per request; use `getDefaultStore()`/`createStore()` per request and pass the store to the `Provider`. See the SSR guide for the exact per-request pattern in your framework.

## atomWithDefault

An atom whose value falls back to a default when unset, and which accepts `RESET`.

## Resettable pattern

A resettable atom accepts the `RESET` symbol in its write function and resets its dependencies too:

```ts
const dollarsAtom = atomWithReset(0)
const centsAtom = atom(
  (get) => get(dollarsAtom) * 100,
  (get, set, value: number | typeof RESET) => {
    if (value === RESET) { set(dollarsAtom, RESET); return }
    set(dollarsAtom, value / 100)
  },
)
```

Use it for forms with a "reset to initial" button.

<!--
Source references:
- https://jotai.org/docs/utilities/lazy
- https://jotai.org/docs/utilities/async
- https://jotai.org/docs/utilities/callback
- https://jotai.org/docs/utilities/ssr
- https://jotai.org/docs/utilities/resettable
-->
