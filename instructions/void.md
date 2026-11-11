> Docs live in `sources/void/docs/`:
> - `guide/` — app-types, quickstart, server-routing, typed-fetch, type-safety, database, env-vars, auth, email, kv, storage, queues, jobs, durable-state, websockets, sse, live, sandboxes, remote-dev, deployment, testing, ssg, ssr, edge/*, pages-routing/*
> - `reference/cli.md` + `reference/cli/*` — one page per CLI group
> - `reference/api.md` + `reference/api/*` — the SDK API surface
> - `reference/config.md`, `reference/structure.md`, `reference/resource-inference.md`
> - `integrations/` — agents, cloudflare, hono, nodejs-bun-deno, frameworks/*
> The published `void` package ships these docs at `node_modules/void/docs/` — prefer that copy inside a project so it matches the installed version.

- Prefer TypeScript over JavaScript.
- Import from `void` and `@void/*` only.
- Keep the Drizzle schema in `db/schema.ts` as the single source of truth.
- Prefer the typed `fetch` from `void/client` over raw `fetch`.
- Prefer the Pages adapter's `Form` with `useForm()`.
- Prefer `Link`'s `aria-current` / `data-void-active` / `data-void-pending` over manual router comparisons.
- Read the bundled guide before changing configuration, persistent resources, auth or deployment.
- Keep native Cloudflare deploys working on Workers Free unless a feature is explicitly opt-in and paid.
