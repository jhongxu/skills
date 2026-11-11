---
name: utilities-state
description: Jotai utils - atomWithStorage, atomWithReducer, useReducerAtom, atomWithReset and RESET, atomWithDefault, atomWithFamily, splitAtom, selectAtom and loadable.
---

# Utilities (`jotai/utils`)

## atomWithStorage

```ts
import { atomWithStorage } from 'jotai/utils'

const darkModeAtom = atomWithStorage('darkMode', false)
```

- Persists to `localStorage` (or `sessionStorage`, or `AsyncStorage` on React Native).
- Default storage: `localStorage` + `JSON.stringify`/`parse` + a `storage` event listener for **cross-tab sync**.
- `getOnInit: true` — read the stored value during initialization. **Without it, an SPA always starts from `initialValue`**, which surprises people.
- Pass a custom `storage` object (`getItem` / `setItem` / `removeItem` / optional `subscribe`).
- `createJSONStorage(() => localStorage)` builds a JSON-serializing storage.

## atomWithReducer

```ts
import { atomWithReducer } from 'jotai/utils'

const countReducer = (prev, action) => {
  if (action.type === 'inc') return prev + 1
  if (action.type === 'dec') return prev - 1
  throw new Error('unknown action type')
}

const countAtom = atomWithReducer(countReducer, 0)
```

`useReducerAtom(atom)` returns `[state, dispatch]` — a `useReducer`-style API over an atom.

## atomWithReset & RESET

```ts
import { atomWithReset, useResetAtom, RESET } from 'jotai/utils'

const dollarsAtom = atomWithReset(0)

const [dollars, setDollars] = useAtom(dollarsAtom)
const reset = useResetAtom(dollarsAtom)
reset()                                  // back to the initial value
```

`RESET` is a unique symbol you can also accept in your own writable atoms to support reset semantics:

```ts
const centsAtom = atom(
  (get) => get(dollarsAtom) * 100,
  (get, set, value: number | typeof RESET) => {
    if (value === RESET) { set(dollarsAtom, RESET); return }
    set(dollarsAtom, value / 100)
  },
)
```

## atomWithDefault

An atom with a default value that can also be `RESET`-ed.

## atomWithFamily

```ts
import { atomFamily } from 'jotai/utils'

const todoAtom = atomFamily((id: string) => atom({ id, done: false }))
```

Creates a **stable** atom per parameter — safe to call during render (unlike calling `atom()` inline).

## splitAtom

```ts
import { splitAtom } from 'jotai/utils'

const todosAtom = atom([{ id: 1, text: 'a' }, { id: 2, text: 'b' }])
const todoAtoms = splitAtom(todosAtom)
```

Returns an array of atoms, one per item, each readable and writable — perfect for rendering a list of inputs bound to a single list atom.

## selectAtom

```ts
const sliceAtom = selectAtom(bigObjectAtom, (v) => v.user.name, shallowEqual)
```

- ⚠️ It is an **escape hatch**: it means the atom model is no longer 100% pure. Prefer derived atoms; use `selectAtom` only when `equalityFn` or `prevSlice` is unavoidable.
- The **base atom and the selector must both be stable** — otherwise you get an infinite render loop. Memoize with `useMemo`/`useCallback`, or define the selector at module scope.

## loadable

Wraps an async atom so it does not suspend — you get `{ state: 'loading' | 'hasError' | 'hasData', data, error }` instead.

<!--
Source references:
- https://jotai.org/docs/utilities/storage
- https://jotai.org/docs/utilities/reducer
- https://jotai.org/docs/utilities/resettable
- https://jotai.org/docs/utilities/family
- https://jotai.org/docs/utilities/split
- https://jotai.org/docs/utilities/select
-->
