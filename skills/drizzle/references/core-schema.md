---
name: core-schema
description: Drizzle ORM schema definition - pgTable and other dialects, column types, constraints, indexes, enums, foreign keys and custom types.
---

# Schema Definition

Declare SQL schemas in TypeScript. Drizzle supports PostgreSQL, MySQL and SQLite (including Turso, Neon, PlanetScale, Cloudflare D1, Bun, LibSQL, better-sqlite3, Durable Objects).

```ts
// drizzle-orm/pg-core
import { pgTable, serial, text, varchar, integer, timestamp, index, unique } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 256 }).notNull(),
  age: integer('age'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique('users_email_unique').on(table.email),
  index('users_name_idx').on(table.name),
])
```

Dialect entry points: `drizzle-orm/pg-core`, `drizzle-orm/mysql-core`, `drizzle-orm/sqlite-core`.

## Columns

Each column builder takes the **SQL name** as the first argument; the TypeScript property name is the object key.

```ts
const table = pgTable('t', {
  id: serial('id').primaryKey(),
  name: text('name'),
  age: integer('age'),
  price: numeric('price', { precision: 10, scale: 2 }),
  active: boolean('active').default(true),
  meta: jsonb('meta').$type<Meta>(),
  tags: text('tags').array(),
  createdAt: timestamp('created_at', { withTimezone: true }),
})
```

Common builders: `serial`, `bigserial`, `smallserial`, `integer`, `bigint`, `smallint`, `real`, `doublePrecision`, `numeric`, `text`, `varchar`, `char`, `boolean`, `date`, `time`, `timestamp`, `interval`, `json`, `jsonb`, `uuid`, `inet`, `cidr`, `macaddr`, `enum`/`pgEnum`, `vector`.

**Modifiers**: `.primaryKey()`, `.notNull()`, `.default(...)`, `.unique()`, `.references(() => other.id)`, `.$type<T>()`, `.array()`, `.generatedAlwaysAsIdentity()`, `.$defaultFn(() => ...)`, `.$onUpdateFn(() => ...)`.

## Extra config — indexes, constraints, policies

⚠️ The third argument returns an **array** (the object form is legacy):

```ts
export const users = pgTable('users', { /* columns */ }, (table) => [
  index('users_email_idx').on(table.email),
  unique('users_email_unique').on(table.email),
  primaryKey({ columns: [table.tenantId, table.id] }),
  check('users_age_check', sql`${table.age} >= 0`),
  foreignKey({ columns: [table.tenantId], foreignColumns: [tenants.id] }),
  pgPolicy('users_rls', { as: 'permissive', for: 'select', using: sql`true` }),
])
```

## Enums

```ts
import { pgEnum } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['admin', 'user'])
export const statusEnum = pgEnum('status', { active: 'active', inactive: 'inactive' })
```

## Custom types

See [custom-types.md](https://github.com/drizzle-team/drizzle-orm/blob/main/docs/custom-types.md) in the repo — implement a `DataType` for database types Drizzle does not ship (geometry, vector variants, custom enums).

## Table helpers

```ts
pgTableCreator((name) => `prefix_${name}`)   // consistent naming across files
pgTableWithSchema('users', {...}, 'public')  // explicit schema
```

## Naming

Drizzle does **not** rename columns to camelCase — the SQL name is whatever you pass. Use `casing` option (`camelCase`, `snakeCase`) on the `drizzle()` client if you want the mapping handled for you.

<!--
Source references:
- https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/pg-core/table.ts
- https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/pg-core/columns/
- https://github.com/drizzle-team/drizzle-orm/blob/main/docs/custom-types.md
-->
