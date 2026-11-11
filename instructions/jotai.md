> Docs live in `sources/jotai/docs/`:
> - `core/` — atom, store, provider, use-atom (the whole core API)
> - `basics/` — concepts, comparison, functional programming
> - `utilities/` — async, callback, family, lazy, reducer, resettable, select, split, ssr, storage
> - `extensions/` — effect, immer, optics, cache, redux, scope, query, trpc, urql, relay, xstate, valtio, location
> - `guides/` — async, composing-atoms, performance, testing, typescript, nextjs, remix, persistence, core-internals, **migrating-to-v3**
> - `recipes/` — small patterns (atomWithToggle, atomWithCompare, atomWithDebounce, useReducerAtom, custom useAtom hooks, …)
> - `tools/` — devtools, babel/swc/rolldown plugins, **skill** (Jotai's own agent skill)

- Prefer TypeScript over JavaScript.
- Define atoms at module scope; use `atomFamily` when you need one atom per parameter.
- Prefer derived atoms over `selectAtom` — `selectAtom` is an escape hatch that breaks the pure atom model.
- Prefer `useSetAtom` in write-only event handlers so the component does not subscribe to the value.
- Keep derived atoms pure and cheap; do heavy computation in write functions, not in render.
- Prefer one source of truth — never mirror the same value into two atoms.
- Keep state in small atoms so re-renders stay local.
