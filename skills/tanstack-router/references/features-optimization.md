---
name: features-optimization
description: TanStack Router performance - code splitting with lazy routes, preloading, render optimizations with structural sharing and fine-grained selectors, the ESLint plugin and devtools.
---

# Performance

## Code splitting

TanStack Router splits code into two categories:

- **Critical route configuration** — path parsing, search param validation, `beforeLoad`, `loader`, route context. Always needed for the current route.
- **Non-critical configuration** — the route `component` and any other heavy code. Loaded on demand.

```tsx
import { lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  component: lazyRouteComponent(() => import('./PostComponent')),
})
```

For file-based routes the plugin can split automatically (`route lazy` in the CLI). When a route is code-split, use `getRouteApi('/posts/$postId')` to access typed hooks from another file without importing the route config (which would defeat the split).

## Preloading

```tsx
<Link to="/posts/$postId" params={{ postId }} preload="intent">Post</Link>
```

| Strategy | Triggers |
|---|---|
| `intent` | hover / touch start |
| `viewport` | enters the viewport |
| `render` | rendered in the DOM |
| `false` | never |

Set the app default with `defaultPreload: 'intent'` on the router.

## Render optimizations

### Structural sharing

The router preserves object references across re-renders where possible — especially useful for search params. Navigating from `?foo=f1&bar=b1` to `?foo=f1&bar=b2` keeps `search.foo` referentially stable and only replaces `search.bar`.

### Fine-grained selectors

Subscribe to a slice of the router state so the component only re-renders for what it uses:

```tsx
const foo = Route.useSearch({ select: ({ foo }) => foo })
```

⚠️ If `select` returns a **new object** every call, the component re-renders every time. Combine with structural sharing (or return primitives) to avoid it.

### Other levers

- Keep `loader` results small — return the shape the component needs.
- Use `useRouterState({ select })` for router-level state (location, matches, params).
- Prefer `useSetParams`/`useNavigate` over re-rendering on search changes.

## ESLint plugin

```sh
npm install -D @tanstack/eslint-plugin-router
```

```js
// eslint.config.js
import pluginRouter from '@tanstack/eslint-plugin-router'

export default [
  ...pluginRouter.configs['flat/recommended'],
]
```

It enforces route option ordering and other router best practices.

## Devtools

```sh
npm install -D @tanstack/react-router-devtools
```

```tsx
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

<TanStackRouterDevtools />
```

Shows the route tree, matches, params, search params and loader data. `TanStackRouterDevtoolsInProd` is the variant that also renders when `NODE_ENV === 'production'`.

<!--
Source references:
- https://tanstack.com/router/latest/docs/framework/react/guide/code-splitting
- https://tanstack.com/router/latest/docs/framework/react/guide/preloading
- https://tanstack.com/router/latest/docs/framework/react/guide/render-optimizations
- https://tanstack.com/router/latest/docs/framework/react/eslint/eslint-plugin-router
- https://tanstack.com/router/latest/docs/framework/react/devtools
-->
