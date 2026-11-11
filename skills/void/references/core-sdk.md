---
name: core-sdk
description: Void framework fundamentals - what Void is, supported app types, project structure, void.config.ts, environment variables and automatic resource inference.
---

# Void Fundamentals

Void is a **full-stack framework for Cloudflare Workers, powered by Vite**. Build your UI with React, Vue, Svelte or Solid and write server code in the same project — routing, data access and deployment stay connected, and types flow across the whole app.

```sh
npm install -D void
npx void init
```

Requires **Node.js 24.22+ or 26.12+**. Vite+ is the default toolchain (you do not need it installed globally).

## App types

Auto-detected from the project structure, or set explicitly in `void.config.ts`:

1. **Void apps** — Vite apps powered by Void's framework layer: API routes, pages mode, auth, crons, queues.
2. **Meta frameworks** — TanStack Start, React Router, SvelteKit, Nuxt, Astro (Void adds resources + deployment).
3. **Static sites** — SPAs, VitePress, or any static directory.

A Void app can be **API-only** (`routes/`), **SPA + API** (`src/` + `routes/`), or **full-stack** (`pages/`).

## Project structure

```
routes/            API endpoints (file-based routing)
pages/             Server-rendered pages (+ companion .server.ts files)
middleware/        Global request middleware
db/                Drizzle schema and SQL migrations
crons/             Scheduled cron jobs
queues/            Async queue consumers
email/             Inbound email handlers
durable-objects/   Durable State modules
```

## Config

```ts
// void.config.ts
import { defineConfig } from 'void/config'

export default defineConfig({
  sourceDir: 'src',
  // ...
})
```

All fields are optional; TypeScript gives completion, and Void re-validates at runtime. Commit `void.config.ts` **and** `void.lock.json` (records resource IDs and migration history).

## Environment variables

Declare them in `env.ts` at the project root:

```ts
import { defineEnv, number, string, url } from 'void/env'

export default defineEnv({
  DATABASE_URL: url(),
  STRIPE_KEY: string(),
  PORT: number().default(3000),
})
```

```ts
import { env } from 'void/env'

const databaseUrl = env.DATABASE_URL
```

- Helpers: `string()`, `number()`, `boolean()`, `url()`, `email()`, `oneOf([...])`, `json<T>()`, all with `.optional()` / `.default(value)`. Any **Standard Schema** validator works too.
- Local values go in `.env`; production secrets use `void secret put`.
- ⚠️ Defaults are source-code constants — never put credentials in one.

## Resource inference

Void scans your source at startup and provisions the matching bindings:

| Binding | Type | Detected by |
|---|---|---|
| `DB` | `D1Database` | `import { db } from 'void/db'` |
| `KV` | `KVNamespace` | `import { kv } from 'void/kv'` |
| `STORAGE` | `R2Bucket` | `import { storage } from 'void/storage'` |

Also detected via `env.DB` / `c.env.DB`. Use config when you need to connect to **existing** resources.

<!--
Source references:
- https://void.cloud/guide
- https://void.cloud/guide/quickstart
- https://void.cloud/guide/app-types
- https://void.cloud/reference/structure
- https://void.cloud/reference/config
- https://void.cloud/guide/env-vars
- https://void.cloud/reference/resource-inference
-->
