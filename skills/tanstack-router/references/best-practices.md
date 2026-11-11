---
name: best-practices
description: TanStack Router best practices - type safety, authenticated routes and the authorization boundary, performance habits, search param handling, debugging and migration notes.
---

# Best Practices

## Use file-based routing

It gives you the same features as code-based routing with less code, plus automatic code splitting and higher type-safety ceiling. Only use code-based routing when you cannot map files to routes.

## Lean on the type system

- Never hand-write route paths in `createFileRoute` — let the plugin manage them.
- Use `linkOptions()` for reusable navigation options so errors surface at the definition site, not at the spread site.
- Validate search params on the route (`validateSearch`) instead of parsing them ad hoc in components.
- In code-based routing, always set `getParentRoute`.

## Keep the loader the only data source

- Put data fetching in `loader`s — they run in parallel, are cached, and are invalidated centrally.
- Do **not** fetch in `useEffect`; the router already coordinates this.
- Keep `beforeLoad` for cheap guards only (redirects, context setup), not for heavy work.
- Return the minimal shape the component needs.

## Route guards are not authorization

`beforeLoad` can gate a route's UI (redirect to `/login` when there is no session), but:

> ⚠️ **A route guard is not a data authorization boundary.** Any server function, server route or API endpoint that returns private data must authorize the request itself, because it can be called independently of the route that calls it.

```tsx
export const Route = createFileRoute('/admin')({
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: '/login' })
  },
})
```

In TanStack Start, put the real authorization in **server middleware** and inside each server function.

## Search params are state

- Treat URL search params as the source of truth for shareable state (filters, pagination, sorting) — not component state.
- Use `select` for fine-grained subscriptions; return primitives to avoid re-render storms.
- Keep the `select` result stable or rely on structural sharing.

## Performance habits

- `defaultPreload: 'intent'` gives near-instant navigation for free.
- Code-split heavy route components with `lazyRouteComponent`.
- Return small loader payloads; the router caches them.
- Watch out for `select` returning a fresh object on every call.

## Debugging

- Install `@tanstack/react-router-devtools` — it shows the route tree, matches, params and loader data live.
- Enable `@tanstack/eslint-plugin-router` — it catches option-order and structural mistakes.
- `router.subscribe('onBeforeLoad', ...)` / `onLoad` / `onResolved` events let you trace the navigation lifecycle.

## Migration notes

- Coming from React Router? The `how-to/migrate-from-react-router` guide maps the concepts; the file-based API and typed search params are the biggest differences.
- Coming from Next.js? Do **not** copy `app/layout.tsx`, `getServerSideProps` or `next/link` — TanStack uses `src/routes/`, `createFileRoute` and `Link` from `@tanstack/react-router`.

<!--
Source references:
- https://tanstack.com/router/latest/docs/framework/react/guide/type-safety
- https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes
- https://tanstack.com/router/latest/docs/framework/react/guide/render-optimizations
- https://tanstack.com/router/latest/docs/framework/react/how-to/debug-router-issues
- https://tanstack.com/router/latest/docs/framework/react/how-to/migrate-from-react-router
-->
