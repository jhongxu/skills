---
name: core-performance
description: memo, useMemo, useCallback, the Rules of React, React Compiler, and the eslint-plugin-react-hooks rule set.
---

# Performance & The Rules of React

## The Rules of React

React relies on these rules; violating them breaks correctness, not just speed.

1. **Components and Hooks are pure.** No mutation of props/state/globals during render, no side effects.
2. **React calls Components and Hooks.** Never call a component function directly (`<User />` is fine, `User()` is not).
3. **Rules of Hooks**: only call Hooks at the **top level** of a component or custom Hook — never inside conditions, loops, or nested functions. Hooks must be called in the same order every render.
4. **Never mutate props/state.** Treat them as immutable.

## Manual memoization

```tsx
const visible = useMemo(() => items.filter(i => i.visible), [items])
const onClick = useCallback((id: string) => select(id), [select])

const MemoRow = memo(function Row({ item }: { item: Item }) {
  return <li>{item.name}</li>
})
```

- `memo(component)` — skip re-render when props are **shallowly equal** (`Object.is` per prop). Props that are objects/arrays/functions break the comparison unless they are referentially stable.
- `useMemo(value, deps)` — cache a **value** between renders. Only use it for an expensive computation; React may throw the cache away.
- `useCallback(fn, deps)` — cache a **function identity** so it can be passed to a memoized child.
- **Measure first.** React Compiler (below) makes manual memoization unnecessary in most code.

## React Compiler

React Compiler is a build-time Babel/Lint plugin that automatically memoizes values and components — it applies the Rules of React's guarantees for you.

- **v1.0** (stable). Install `babel-plugin-react-compiler` and enable it in your build.
- With the compiler on, **do not add manual `memo`/`useMemo`/`useCallback`** — the compiler handles it and manual memoization can defeat its optimizations (the `preserve-manual-memoization` lint flags this).
- The compiler **skips** any component/hook that violates the Rules of React and reports a diagnostic; the rest of the app still compiles.
- Directives: `"use memo"` (force compilation of a function) and `"use no memo"` (opt out) — as a string literal at the top of a function or module.
- Compilation modes: `all` (compile everything), `infer` (heuristics, default), `annotation` (only functions with `"use memo"`).
- Config options: `target` (React 17/18/19), `panicThreshold` (fail build vs skip), `logger`, `gating` (runtime flags for A/B), `compilationMode`.
- Library authors: ship compiled code so all users benefit; add `react-compiler-runtime` when supporting React < 19.

## eslint-plugin-react-hooks

The linter that enforces the Rules of React. Its diagnostics surface **React Compiler errors too**, so you can use it even without adopting the compiler.

Recommended preset rules (v6):

| Rule | Catches |
|---|---|
| `exhaustive-deps` | missing/incorrect Effect dependencies |
| `rules-of-hooks` | conditional/loop Hook calls |
| `set-state-in-render` | calling `setState` during render |
| `set-state-in-effect` | synchronously setting state inside an Effect |
| `immutability` | mutating props/state |
| `purity` | impure calls during render (e.g. `Date.now()`) |
| `refs` | reading/writing refs during render |
| `globals` | mutating globals during render |
| `static-components` | components recreated on every render |
| `component-hook-factories` | HOFs that define nested components/hooks |
| `error-boundaries` | `try/catch` around children instead of an Error Boundary |
| `use-memo` | `useMemo` without a return value |
| `preserve-manual-memoization` | manual memoization that defeats the compiler |
| `incompatible-library` | libraries incompatible with memoization |
| `unsupported-syntax` | syntax the compiler cannot handle |

Fixing violations is a gradual process: the compiler skips only the offending components, so you can improve coverage over time.

## Other performance levers

- **Move state down** — the biggest win: a state update only re-renders the subtree that reads it. Lifting state higher re-renders more.
- **Pass a single object as a prop** instead of many, so `memo` sees one changed reference instead of several.
- **Do not create components inside components** — a new function identity remounts the subtree.
- **Use `key` correctly** — stable keys let React reuse DOM and state; index keys cause full remounts on reorder.
- **Virtualize long lists** (react-window etc.) — thousands of rows are a rendering problem, not a memoization one.
- **Profile with the React DevTools Profiler** before optimizing; the "why did this render" panel explains each re-render.

<!--
Source references:
- https://react.dev/reference/react/memo
- https://react.dev/reference/react/useMemo
- https://react.dev/reference/react/useCallback
- https://react.dev/reference/rules/rules-of-hooks
- https://react.dev/reference/rules/components-and-hooks-must-be-pure
- https://react.dev/reference/react-compiler/configuration
- https://react.dev/reference/react-compiler/directives
- https://react.dev/reference/react-compiler/compiling-libraries
- https://react.dev/reference/eslint-plugin-react-hooks
-->
