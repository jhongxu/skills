---
name: features-data
description: Void data and runtime features - Drizzle database and migrations, KV, R2 storage, queues, cron jobs, Durable State, WebSockets, server-sent events and live streams.
---

# Data & Runtime

## Database

```ts
import { db } from 'void/db'
import { users } from '@schema'   // db/schema.ts — the source of truth

const rows = await db.select().from(users)
```

- The schema lives in `db/schema.ts` and is written with **Drizzle**.
- Void provides a **local database in development** and provisions one when you deploy.
- SQL migrations live in `db/`; `void migrate` applies them. `void deploy` applies migrations too (skip with `--skip-migrations`).
- Schema-derived validators power `defineHandler.withValidator()` — the same schema validates the request and types the response.
- ORMs and external databases (PostgreSQL, MySQL) are supported via `docs/guide/database.md`.

## KV

```ts
import { kv } from 'void/kv'
await kv.put('key', 'value')
```

## Object storage (R2)

```ts
import { storage } from 'void/storage'
await storage.put('uploads/1.png', body)
```

## Queues

Consumers live in `queues/`; producers send messages. Async work without blocking the request.

## Cron jobs

Scheduled handlers live in `crons/`.

## Durable State

`durable-objects/` holds Durable State modules — stateful, long-lived objects. Before moving deployed Durable State or native Durable Object definitions, read the guides and use `void info` to preserve resource names and instance keys.

## WebSockets

```ts
// guide/docs/guide/websockets.md
const socket = connect('/ws')
```

## Server-sent events & live streams

`docs/guide/sse.md` and `docs/guide/live.md` cover SSE responses and live updates.

## AI inference

`docs/guide/ai.md` covers Workers AI and other providers. Usage limits reject with `UsageLimit` from `void/limits`; Void routes and Pages actions return HTTP 429 automatically — catch with `instanceof UsageLimit` for a custom fallback.

<!--
Source references:
- https://void.cloud/guide/database
- https://void.cloud/guide/kv
- https://void.cloud/guide/storage
- https://void.cloud/guide/queues
- https://void.cloud/guide/jobs
- https://void.cloud/guide/durable-state
- https://void.cloud/guide/websockets
- https://void.cloud/guide/sse
- https://void.cloud/guide/live
- https://void.cloud/guide/ai
-->
