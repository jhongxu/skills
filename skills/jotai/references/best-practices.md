---
name: best-practices
description: Jotai best practices - performance rules, atom design, TypeScript requirements, testing with Testing Library, DevTools, SSR, and the v2 to v3 migration.
---

# Best Practices

## Performance

- **Keep renders cheap.** React may call your component multiple times per render phase — component functions must be idempotent.
- **Move heavy computation out of render.** Do it once in a write function (an "action") and store the result, instead of computing it in a selector on every render.
- **Split state into small atoms.** A component that reads a big atom re-renders whenever that atom changes. Observing small atoms keeps re-renders local.
- **Use `useSetAtom` for write-only handlers** so the component does not subscribe to the value.
- Avoid `selectAtom` unless a custom `equalityFn` is truly needed — it breaks the pure atom model.

## Atom design

- Define atoms at **module scope**; a config created during render is a new identity every time.
- Keep derived atoms pure: no side effects, no `Date.now()`, no randomness.
- Use `atomFamily` when you need one atom per parameter — it keeps identities stable.
- Use **write-only action atoms** for mutations: they keep the transition logic in one place and make the intent explicit.
- Prefer one source of truth: don't mirror the same value into two atoms.

## TypeScript

- **TypeScript 5.5+** and `strictNullChecks` are required (Jotai relies on inference).
- Primitive atoms are inferred: `atom(0)` is `number`.
- Derived atoms need explicit generics when inference is not enough:

```ts
const derived = atom((get) => get(baseAtom).items.length)   // inferred
const explicit = atom<string>((get) => get(baseAtom).name)  // explicit
```

## Testing

Test through the UI, treating Jotai as an implementation detail:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Counter } from './Counter'

test('increments the counter', async () => {
  render(<Counter />)
  await userEvent.click(screen.getByRole('button'))
  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})
```

To inject values before a test, render with a `Provider` that has its own `createStore()` and pre-set the atoms.

## DevTools

`jotai-devtools` shows the atom tree, lets you inspect and edit atom values, and highlights which component subscribed to which atom.

## SSR & frameworks

- Create **one store per request** on the server and pass it to the `Provider` — never share a store across requests.
- Jotai works with Next.js (App and Pages Router), Remix, Waku and React Native; each has a guide.

## v2 → v3 migration

The public API is **unchanged** (`useAtom`, `useAtomValue`, `useSetAtom` keep their signatures) — if your v2 app runs without deprecation warnings, it should run on v3 as-is.

| Change | v3 |
|---|---|
| React | **18+** (v2 supported 17) |
| TypeScript | **5.5+** (v2 supported 3.8) |
| Node.js | **>= 22.12.0** (v2 supported 12.20) |
| Packaging | **ESM only** — CJS, UMD and SystemJS builds are gone |
| New hooks | `useAtomValueRaw`, `useAtomValueRawSync` (read async atoms without suspending) |

One subtlety: `useAtomValue` has a **mount-timing change** in v3 — see the `use-atom` docs for the details.

## Official Jotai skill

Jotai ships its own agent skill, maintained in a separate repo:

```sh
npx skills add jotaijs/jotai-skills --skill jotai
```

It covers atom design, derived atoms, write-only action atoms, async atoms, Provider/store usage, render performance, TypeScript, tests, utilities and extensions — and it can drive a v2 → v3 migration.

<!--
Source references:
- https://jotai.org/docs/guides/performance
- https://jotai.org/docs/guides/testing
- https://jotai.org/docs/guides/typescript
- https://jotai.org/docs/guides/migrating-to-v3
- https://jotai.org/docs/guides/nextjs
- https://jotai.org/docs/tools/devtools
- https://jotai.org/docs/tools/skill
-->
