> Docs live in `sources/tanstack-router/docs/`:
> - `router/overview.md`, `router/quick-start.md` — intro
> - `router/routing/` — routing concepts, file-based & code-based routing, file naming conventions, route trees, virtual routes, route matching
> - `router/guide/` — one page per feature (navigation, link-options, path-params, search-params, data-loading, deferred-data-loading, data-mutations, preloading, code-splitting, render-optimizations, authenticated-routes, not-found-errors, outlets, parallel-routes, route-masking, scroll-restoration, document-head-management, navigation-blocking, ssr, router-context, static-route-data, type-safety, custom-search-param-serialization, url-rewrites, history-types, internationalization-i18n, …)
> - `router/api/` — the full API reference (one file per export)
> - `router/how-to/` — task-oriented recipes (testing, SSR, auth, RBAC, migrating from react-router, …)
> - `router/eslint/`, `router/devtools.md` — tooling
> - `start/framework/react/` — TanStack Start (overview, execution-model, server-functions, server-routes, middleware, spa-mode, isr, selective-ssr, …)
>
> Note: the docs cover **both React and Solid** — prefer the React examples unless the user works with Solid.

- Prefer TypeScript over JavaScript.
- Prefer **file-based routing** over code-based routing.
- Put data fetching in route `loader`s, never in `useEffect`.
- Validate search params on the route with `validateSearch` instead of parsing them in components.
- Use `linkOptions()` for reusable navigation options so type errors surface at definition time.
- Enable `@tanstack/eslint-plugin-router` and the router devtools.
- Treat route guards as UI gating only — authorize every server function and server route on its own.
