---
name: react
description: React 19 function components, Hooks, state and effects, Transitions, Server Components, and React Compiler. Use when building React apps, writing components, managing state, optimizing re-renders, or working with react-dom and RSC.
metadata:
  author: jianghongxu
  version: "2026.11.11"
  source: Generated from https://github.com/reactjs/react.dev, scripts at https://github.com/jhongxu/skills
---

# React

> Based on React 19.3, generated at 2026-11-11. Always use function components with Hooks; prefer TypeScript.

## Preferences

- Prefer using TypeScript over JavaScript.
- Prefer function components with hooks over class components.
- Do not mutate props or state; treat state as immutable.
- Derive values during render instead of storing them in state or effects.
- Prefer `key` over index for list items, and never mutate a key.
- Avoid `useEffect` for derived state, event handling, or data fetching that the framework can handle.
- Prefer the React Compiler-friendly patterns (no manual `memo`/`useMemo`/`useCallback` unless measured).

## Core

| Topic | Description | Reference |
|-------|-------------|-----------|
| Components, JSX & Props | Function components, JSX rules, props, children, keys, lists, purity | [core-components](references/core-components.md) |
| State | `useState`, state-as-snapshot, immutable updates, batching, state structure | [core-state](references/core-state.md) |
| Reducer, Context & Hooks | `useReducer`, `createContext`/`useContext`, custom hooks | [core-reducer-context](references/core-reducer-context.md) |
| Refs & Escape Hatches | `useRef`, DOM manipulation, `useImperativeHandle` | [core-refs](references/core-refs.md) |
| Effects | `useEffect`, dependencies, lifecycle, events vs effects, `useLayoutEffect`, `useEffectEvent` | [core-effects](references/core-effects.md) |
| Performance & Rules | `memo`/`useMemo`/`useCallback`, React Compiler, eslint-plugin-react-hooks | [core-performance](references/core-performance.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|--------|
| Transitions & Async State | `useTransition`, `useDeferredValue`, `useActionState`, `useOptimistic`, `use` | [advanced-transitions](references/advanced-transitions.md) |
| React DOM APIs | Roots, hydration, portals, `flushSync`, resource hints, forms, SSR | [advanced-react-dom](references/advanced-react-dom.md) |

## Advanced

| Topic | Description | Reference |
|-------|-------------|--------|
| Server Components | `'use client'` / `'use server'`, Server Functions, `cache` | [advanced-rsc](references/advanced-rsc.md) |

## Best Practices

| Topic | Description | Reference |
|-------|-------------|--------|
| Workflow & Tooling | Thinking in React, declarative UI, TypeScript, testing, DevTools | [best-practices](references/best-practices.md) |

## Quick Reference

### Component

```tsx
interface AvatarProps { name: string; size?: number }

export function Avatar({ name, size = 100 }: AvatarProps) {
  return <img src={`/avatars/${name}.png`} width={size} height={size} alt={name} />
}
```

### State & reducer

```tsx
const [items, setItems] = useState<Item[]>(() => [])
setItems(prev => [...prev, next])                 // functional updater when based on previous state

const [state, dispatch] = useReducer(reducer, initial)
```

### Effect (only for external systems)

```tsx
useEffect(() => {
  const conn = connect(roomId)
  return () => conn.disconnect()
}, [roomId])
```

### Transition & action

```tsx
const [isPending, startTransition] = useTransition()
startTransition(() => setTab(next))

const [state, dispatchAction, isPending] = useActionState(action, initial)
```

### Rules to remember

- Never call a component as a function; never call Hooks conditionally.
- Never mutate props or state; never mutate anything outside the component during render.
- Effects synchronize with **external** systems — everything else is render-time computation or event handling.
- The dependency list describes your code: change the code to change the list.
- Use stable ids as `key`; index keys break on reorder.
- With React Compiler enabled, skip manual `memo`/`useMemo`/`useCallback`.
