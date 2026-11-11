---
name: core-atoms
description: Jotai atom configs - primitive atoms, derived atoms (read-only, write-only, read-write), the get/set functions, and how atom values are stored separately from configs.
---

# Atoms

An **atom config** is an immutable definition. It does **not** hold a value — the value lives in a *store*.

```ts
import { atom } from 'jotai'

const priceAtom = atom(10)                       // primitive
const productAtom = atom({ id: 12, name: 'good' }) // primitive (object)
```

Primitive atoms behave like `useState`: the initial value is stored the first time the atom is used.

## Derived atoms

```ts
// read-only
const doubled = atom((get) => get(priceAtom) * 2)

// write-only (pass null as the read function by convention)
const discount = atom(null, (get, set, update: { discount: number }) => {
  set(priceAtom, get(priceAtom) - update.discount)
})

// read-write
const both = atom(
  (get) => get(priceAtom) * 2,
  (get, set, next: number) => set(priceAtom, next / 2),
)
```

- **`get`** in the **read** function is **reactive** — read dependencies are tracked, and the derived atom re-computes when they change.
- **`get`** in the **write** function is **not** tracked — it is a plain read.
- **`set`** in the write function updates other atoms (or the atom itself).

## The composability idea

Everything is an atom, so dumb atoms compose into smarter ones:

```ts
const friendsAtom = atom([{ name: 'Friend 1', online: false }])
const onlineFriendsAtom = atom((get) => get(friendsAtom).filter((f) => f.online))
const offlineFriendsAtom = atom((get) => get(friendsAtom).filter((f) => !f.online))
```

Keep derived atoms **pure and cheap** — they run during render.

## Rules

- An atom config is **stable** — define it at module scope, never inside a component (a new config each render breaks identity and causes loops).
- Never mutate an atom value in place; `set` with a new value.
- Use `useMemo` if you must create an atom dynamically (e.g. `atomFamily`).

## Typed atoms

```ts
const numAtom = atom(0)                       // inferred number
const numAtom = atom<number>(0)               // explicit
const numAtom = atom<number | null>(0)         // explicit union
```

Jotai relies on inference — keep `strictNullChecks` on.

<!--
Source references:
- https://jotai.org/docs/core/atom
- https://jotai.org/docs/basics/concepts
- https://jotai.org/docs/guides/typescript
-->
