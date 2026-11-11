> Docs live in `sources/react/src/content/` (React does not use a `docs/` folder):
> - `learn/` — guide pages (state, effects, lists, purity, TS)
> - `reference/react/` — Hook and component API reference
> - `reference/react-dom/` — client, server, static and resource APIs
> - `reference/rsc/` — Server Components, `'use client'`, `'use server'`
> - `reference/rules/` — Rules of React
> - `reference/react-compiler/` — React Compiler configuration
> - `reference/eslint-plugin-react-hooks/` — lint rules
> - `blog/` — release notes (use these to date API versions, e.g. 19.2/19.3)

- Prefer using TypeScript over JavaScript.
- Prefer function components with hooks over class components.
- Do not mutate props or state; treat state as immutable.
- Derive values during render instead of storing them in state or effects.
- Prefer `key` over index for list items, and never mutate a key.
- Avoid `useEffect` for derived state, event handling, or data fetching that the framework can handle.
- Prefer the React Compiler-friendly patterns (no manual `memo`/`useMemo`/`useCallback` unless measured).
