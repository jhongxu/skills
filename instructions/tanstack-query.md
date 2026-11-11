> Docs live in `sources/tanstack-query/docs/framework/react/`:
> - `overview.md`, `quick-start.md`, `installation.md`, `typescript.md`, `devtools.md`
> - `guides/` — one page per topic (queries, query-keys, mutations, query-invalidation, optimistic-updates, infinite-queries, paginated-queries, suspense, ssr, advanced-ssr, prefetching, caching, filters, network-mode, retries, polling, placeholder-query-data, render-optimizations, request-waterfalls, testing, …)
> - `reference/` — the full API reference (one file per export)
> - `plugins/` — persistQueryClient and the persisters
> The repo also documents Solid/Svelte/Vue/Angular — prefer the React pages.

- Prefer TypeScript over JavaScript.
- Define query keys and options in a shared `queryOptions` factory per resource.
- Keep `queryFn` a pure fetch — writes go through `useMutation`.
- Invalidate narrowly (`['todos', id]`) rather than invalidating everything.
- Use `placeholderData: keepPreviousData` for pagination.
- Enable the devtools in development and disable retries in tests.
