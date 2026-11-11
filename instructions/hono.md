> Docs live in `sources/hono/docs/` (this is the hono.dev website repo, not the framework repo):
> - `api/` — `hono.md`, `routing.md`, `context.md`, `request.md`, `exception.md`, `presets.md`
> - `concepts/` — middleware, routers, web-standard, stacks, motivation
> - `middleware/builtin/` — one page per built-in middleware (cors, jwt, logger, cache, csrf, …)
> - `middleware/third-party.md` — ecosystem middleware
> - `helpers/` — cookie, jwt, proxy, html, streaming, websocket, ssg, factory, testing, dev, accepts, …
> - `guides/` — rpc, validation, testing, jsx, best-practices, migrating-to-v5, deployment guides
> - `agents/cli.md` — the Hono CLI, designed for coding agents
> - `getting-started/` — per-runtime setup (nodejs, bun, deno, cloudflare-workers, …)
>
> Note: the framework **source** is a separate repo (`honojs/hono`); the docs here describe the public API.

- Prefer TypeScript over JavaScript.
- Prefer Hono's typed helpers (`hc`, `zValidator`, `zod-openapi`) over raw `fetch` and hand-rolled validation.
- Keep handlers thin: extract business logic into plain functions and unit-test them.
- Middleware order is significant — put auth/CORS/logging before the handlers they affect.
- Prefer `c.env` for bindings/secrets over `process.env` so the code runs on every runtime.
- Always return an explicit `Response`; use the context helpers (`c.json`, `c.text`, `c.html`) instead of `new Response`.
