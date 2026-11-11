---
name: jotai
description: Jotai v3 atomic state management for React - atoms, derived atoms, async atoms with Suspense, Provider and store, jotai/utils and extensions, and performance rules. Use when managing shared React state with Jotai.
metadata:
  author: jianghongxu
  version: "2026.11.11"
  source: Generated from https://github.com/pmndrs/jotai, scripts at https://github.com/jhongxu/skills
---

# Jotai

> Based on Jotai v3, generated at 2026-11-11. ESM only; requires React 18+, TypeScript 5.5+, Node 22.12+.

## Preferences

- Prefer TypeScript over JavaScript.
- Define atoms at module scope; use `atomFamily` when you need one atom per parameter.
- Prefer derived atoms over `selectAtom` — `selectAtom` is an escape hatch that breaks the pure atom model.
- Prefer `useSetAtom` in write-only event handlers so the component does not subscribe to the value.
- Keep derived atoms pure and cheap; do heavy computation in write functions, not in render.
- Prefer one source of truth — never mirror the same value into two atoms.
- Keep state in small atoms so re-renders stay local.

## Core

| Topic | Description | Reference |
|-------|-------------|--------|
| Atoms | Primitive and derived atoms, read-only / write-only / read-write, `get`/`set` semantics | [core-atoms](references/core-atoms.md) |
| Hooks & Stores | `useAtom`, `useAtomValue`, `useSetAtom`, `useAtomValueRaw`, Provider, `createStore` | [core-hooks](references/core-hooks.md) |
| Async Atoms | Async read/write atoms, Suspense, `unwrap`, `atomWithObservable` | [core-async](references/core-async.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|--------|
| State Utilities | `atomWithStorage`, `atomWithReducer`, `atomWithReset`/`RESET`, `atomWithDefault`, `atomWithFamily`, `splitAtom`, `selectAtom` | [utilities-state](references/utilities-state.md) |
| Advanced Utilities | `atomWithLazy`, `unwrap`, `callback`, SSR helpers, resettable pattern | [utilities-advanced](references/utilities-advanced.md) |
| Extensions | jotai-effect, jotai-immer, jotai-optics, jotai-cache, jotai-redux, jotai-scope, jotai-query, jotai-trpc | [extensions](references/extensions.md) |

## Best Practices

| Topic | Description | Reference |
|-------|-------------|--------|
| Performance, TS, Testing | Render cost, atom design, TypeScript rules, Testing Library, DevTools, SSR, v2 → v3 | [best-practices](references/best-practices.md) |

## Quick Reference

### Atoms

```ts
import { atom } from 'jotai'

const countAtom = atom(0)
const doubledAtom = atom((get) => get(countAtom) * 2)              // derived
const incrementAtom = atom(null, (get, set) => set(countAtom, get(countAtom) + 1))  // action
```

### Hooks

```ts
const [count, setCount] = useAtom(countAtom)
const count = useAtomValue(countAtom)
const setCount = useSetAtom(countAtom)     // write only, no re-render
```

### Provider & store

```tsx
const store = createStore()
<Provider store={store}><App /></Provider>
```

### Async

```ts
const userAtom = atom(async (get) => fetchUser(get(idAtom)))
const actionAtom = atom(null, async (get, set, payload) => { await save(payload) })
```

### Things that bite

- An atom config holds **no value** — values live in the store; `Provider` supplies one per subtree.
- `get` in a **read** function is reactive; `get` in a **write** function is not.
- `selectAtom` needs a **stable base atom and selector**, or you get an infinite loop.
- `atomWithStorage` returns the **initial value** on init unless `getOnInit: true`.
- v3 is ESM only and drops React 17 / TypeScript < 5.5 / Node < 22.12.
