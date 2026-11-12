---
name: features-integrations
description: Drizzle ecosystem - schema-to-Zod/Valibot/ArkType/TypeBox validators, drizzle-seed, the drizzle eslint plugin, and the supported database drivers.
---

# Ecosystem

## Schema validators

Turn a table schema into a validator for forms and APIs.

### drizzle-zod

```ts
import { createSelectSchema, createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)
export const updateUserSchema = createUpdateSchema(users)

// refine
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email(),
})
```

Also available: `bufferSchema`, `jsonSchema`, `literalSchema` for custom column types.

### drizzle-valibot / drizzle-arktype / drizzle-typebox

The same idea for Valibot, ArkType and TypeBox.

## drizzle-seed

```sh
npm i -D drizzle-seed
```

```ts
import { seed } from 'drizzle-seed'

await seed(db, {
  users: [{ id: 1, name: 'Ada' }],
})
```

Generates deterministic or random test data for a schema.

## eslint-plugin-drizzle

```sh
npm i -D eslint-plugin-drizzle
```

Catches common ORM mistakes, e.g. `await` inside `forEach` (which silently does nothing in async code).

## Drivers

Drizzle ships a driver per runtime and database:

| Package | Target |
|---|---|
| `drizzle-orm/node-postgres` | node-postgres (`pg`) |
| `drizzle-orm/postgres-js` | postgres.js |
| `drizzle-orm/neon-http` / `neon-serverless` | Neon |
| `drizzle-orm/planetscale-serverless` | PlanetScale |
| `drizzle-orm/mysql2` | mysql2 |
| `drizzle-orm/bun-sql` / `bun-sqlite` | Bun |
| `drizzle-orm/better-sqlite3` | better-sqlite3 |
| `drizzle-orm/libsql` | Turso / libSQL |
| `drizzle-orm/d1` | Cloudflare D1 |
| `drizzle-orm/durable-sqlite` | Durable Objects |
| `drizzle-orm/expo-sqlite` | React Native / Expo |
| `drizzle-orm/op-sqlite` | op-sqlite |
| `drizzle-orm/sql-js` | sql.js |

Each driver exposes `drizzle()`:

```ts
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

export const db = drizzle(process.env.DATABASE_URL!, { schema })
```

Passing `schema` enables the relational query builder (`db.query`).

## Casing

```ts
drizzle(url, { casing: 'snake_case' })
```

Maps camelCase TS properties to snake_case columns automatically.

<!--
Source references:
- https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-zod/src/schema.ts
- https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/node-postgres/driver.ts
-->
