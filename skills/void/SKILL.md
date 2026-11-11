---
name: void
description: Void framework - full-stack apps on Cloudflare Workers powered by Vite, with file-based API routes, Pages mode with loaders and actions, Drizzle databases, typed fetch and end-to-end type inference, plus the void CLI and deployment.
metadata:
  author: jianghongxu
  version: "2026.11.11"
  source: Generated from https://github.com/voidzero-dev/void, scripts at https://github.com/jhongxu/skills
---

# Void

> Based on Void v1.7, generated at 2026-11-11. Requires Node.js 24.22+ or 26.12+.

## Preferences

- Prefer TypeScript over JavaScript.
- Import from `void` and `@void/*` only — never from internal paths.
- Keep the Drizzle schema in `db/schema.ts` as the single source of truth; let the type pipeline carry it to the UI.
- Prefer `void/client`'s typed `fetch` over raw `fetch` — path, method and body are all checked.
- Use the Pages adapter's `Form` with `useForm()` so action failures stay visible and input is preserved.
- Prefer `Link`'s `aria-current` / `data-void-active` / `data-void-pending` over comparing router state manually.
- Read the bundled guide at `node_modules/void/docs/` before changing configuration, resources, auth or deployment.

## Core

| Topic | Description | Reference |
|-------|-------------|--------|
| Fundamentals | What Void is, app types, project structure, `void.config.ts`, env vars, resource inference | [core-sdk](references/core-sdk.md) |
| Server Routing | File-based routes, `defineHandler`, `withValidator`, matching priority, typed fetch | [core-routing](references/core-routing.md) |
| Pages Mode | Pages + `.server.ts` loaders and actions, layouts, error pages, islands, link states | [core-pages](references/core-pages.md) |
| Type Safety | The type pipeline, Drizzle → RouteMap → typed fetch, `InferProps`, typed URLs | [core-types](references/core-types.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|--------|
| Data & Runtime | Database and migrations, KV, R2 storage, queues, crons, Durable State, WebSockets, SSE, AI | [features-data](references/features-data.md) |
| CLI & Deployment | `init`/`dev`/`deploy`/`connect`, secrets, domains, sandboxes, Void Platform | [features-deploy](references/features-deploy.md) |
| Integrations | TanStack Start, React Router, SvelteKit, Nuxt, Astro, Analog, Hono, Cloudflare, Node/Bun/Deno, agents | [features-integrations](references/features-integrations.md) |

## Best Practices

| Topic | Description | Reference |
|-------|-------------|--------|
| Habits | Type-driven workflow, Workers Free compatibility, auth, email, testing, agent workflow | [best-practices](references/best-practices.md) |

## Quick Reference

### Server route

```ts
// routes/api/users.ts
import { defineHandler } from 'void'
import { db } from 'void/db'
import { users } from '@schema'

export const GET = defineHandler(async (c) => c.json(await db.select().from(users)))
```

### Typed client

```ts
import { fetch } from 'void/client'

const users = await fetch('/api/users')
```

### Page + loader + action

```ts
// pages/users/index.server.ts
import { defineHandler, type InferProps } from 'void'

export const loader = defineHandler(async (c) => ({ users: [] }))
export const action = defineHandler.withValidator({ body: schema })(async (c) => {})
export type Props = InferProps<typeof loader>
```

### Things that bite

- `params`/`searchParams` are **not** the only API — routes use `[id]` / `[...slug]` brackets like the filenames.
- Only the **most specific** route wins: static > `[param]` > `[...slug]`.
- `fetch` from `void/client` only accepts routes that exist — typos fail at compile time.
- Functions and custom class instances **cannot** be sent as page data.
- `void deploy` applies migrations — use `--skip-migrations` when they run separately.
- Platform hostnames default to HTTPS; loopback defaults to HTTP.
- Void ships its **own** agent skill — prefer the app's `node_modules/void/docs/` over the website.
