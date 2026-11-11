---
name: core-async
description: Jotai async atoms - async read atoms with Suspense, async write atoms as actions, the unwrap util, and atomWithObservable.
---

# Async Atoms

Two kinds:

- **Async read atom** — the request starts as soon as the value is read ("smart getter").
- **Async write atom** — the request starts at a specific moment ("action").

## Async read atoms

```ts
const countAtom = atom(1)
const asyncAtom = atom(async (get) => get(countAtom) * 2)
```

Jotai leans on React `Suspense`:

```tsx
const Component = () => {
  const [num] = useAtom(asyncAtom)   // `num` is a number, not a Promise
  return <div>{num}</div>
}

const App = () => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
)
```

When another atom reads an async atom, `get` returns the **promise as-is** — so the dependent atom must also be async:

```ts
const anotherAtom = atom(async (get) => (await get(asyncAtom)) / 2)
```

Same for write functions that read an async atom.

## Async write atoms

```ts
const asyncIncrementAtom = atom(null, async (get, set) => {
  const res = await fetch('/api/inc')
  set(countAtom, get(countAtom) + 1)
})
```

## Avoiding suspension

- `unwrap(anAtom)` converts an async atom into a sync one. While the promise is pending it returns `undefined` — or a fallback you provide (which can reuse the previous resolved value). **Errors are not caught** and are thrown on read.
- `useAtomValueRaw` / `useAtomValueRawSync` read the raw promise so you can manage loading and error states yourself.

```ts
import { unwrap } from 'jotai/utils'

const delayed = atom(async (get) => { /* ... */ })
const sync = unwrap(delayed)                  // undefined while pending
const withFallback = unwrap(delayed, (prev) => prev)  // keeps the last value
```

## atomWithObservable

```ts
import { atomWithObservable } from 'jotai/utils'

const counterAtom = atomWithObservable(() => interval(1000).pipe(map((i) => `#${i}`)))
```

Wraps an RxJS-like observable/subject; the atom value is the last emitted value.

## Async gotchas

- Every atom that depends on an async atom must be async.
- An async atom read **outside** `<Suspense>` in a server component may need `loadable` or explicit handling.
- Async write atoms are the right place for side effects — keep them free of rendering logic.

<!--
Source references:
- https://jotai.org/docs/guides/async
- https://jotai.org/docs/utilities/async
-->
