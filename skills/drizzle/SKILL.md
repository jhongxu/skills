---
name: drizzle
description: Drizzle ORM - a headless TypeScript ORM for PostgreSQL, MySQL and SQLite with SQL-like query builders, relational queries, Drizzle Kit migrations, schema-to-Zod validators and multi-runtime drivers.
metadata:
  author: jianghongxu
  version: "2026.11.12"
  source: Generated from https://github.com/drizzle-team/drizzle-orm, scripts at https://github.com/jhongxu/skills
---

# Drizzle ORM

> Based on Drizzle ORM v0.45, generated at 2026-11-12. ~7.4kb min+gzipped, tree-shakeable, 0 dependencies.

## Preferences

- Prefer TypeScript over JavaScript.
- Keep the schema in one module and let Drizzle Kit diff it against the snapshot.
- Use `generate` + `migrate` in production; `push` only in development.
- Always use the `sql` template tag for raw SQL — never concatenate strings.
- Prefer the relational builder for nested reads and explicit joins when you need a flat shape.
- Select only the columns you need.
- Use `batch()` for bulk writes.

## Core

| Topic | Description | Reference |
|-------|-------------|--------|
| Schema Definition | `pgTable`, column types, modifiers, indexes/constraints, enums, custom types | [core-schema](references/core-schema.md) |
| Queries | select/insert/update/delete, where, joins with nested partial select, groupBy, sql, subqueries, alias, aggregates | [core-queries](references/core-queries.md) |
| Relations | `relations()` with one/many, `db.query` RQB with findMany/findFirst, `with` clauses | [core-relations](references/core-relations.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|--------|
| Drizzle Kit & Migrations | generate/migrate/push/pull/studio/check, `drizzle.config.ts`, programmatic migrator | [features-migrations](references/features-migrations.md) |
| Ecosystem | drizzle-zod/valibot/arktype/typebox, drizzle-seed, eslint plugin, drivers per runtime | [features-integrations](references/features-integrations.md) |
| Caching | The opt-in cache module, Upstash integration, custom `Cache` implementations | [features-cache](references/features-cache.md) |

## Best Practices

| Topic | Description | Reference |
|-------|-------------|--------|
| Habits | Transactions, batch, `DrizzleQueryError`, injection safety, schema conventions, performance | [best-practices](references/best-practices.md) |

## Quick Reference

### Schema

```ts
import { pgTable, serial, text, timestamp, index } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('users_name_idx').on(table.name),
])
```

### Client

```ts
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

export const db = drizzle(process.env.DATABASE_URL!, { schema })
```

### Queries

```ts
const rows = await db.select({ id: users.id, name: users.name })
  .from(users)
  .where(eq(users.name, 'Ada'))
  .orderBy(desc(users.createdAt))

await db.insert(users).values({ name: 'Ada' }).returning()
await db.update(users).set({ name: 'Ada' }).where(eq(users.id, 1))
await db.delete(users).where(eq(users.id, 1))
```

### Relational

```ts
const users = await db.query.users.findMany({
  where: eq(users.active, true),
  with: { posts: true },
})
```

### Things that bite

- The table's third argument returns an **array** of indexes/constraints — the object form is legacy.
- `pgTable` does **not** auto-convert camelCase to snake_case — pass the SQL name explicitly.
- Joining flattens and nullifies columns — group a table's fields in a nested object in `.select()` to keep them typed.
- `sql` must be used as a template tag; interpolating strings is an injection risk.
- `numeric`/`bigint` come back as strings by default.
- Drizzle does **not** cache queries unless you opt in (v0.44+ `cache` module).
