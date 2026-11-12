---
name: features-migrations
description: Drizzle Kit - the CLI for schema migrations, generate/migrate/push/pull/studio commands, configuration, and the programmatic migrator.
---

# Drizzle Kit & Migrations

Drizzle Kit is the CLI companion: it traverses your schema module, generates a snapshot, compares it with the previous version and produces the SQL migrations. Ambiguous cases (like renames) prompt you for input.

```sh
npm i -D drizzle-kit
```

## Commands

| Command | Purpose |
|---|---|
| `drizzle-kit generate` | generate SQL migration files from the schema diff |
| `drizzle-kit migrate` | apply the generated migrations to the database |
| `drizzle-kit push` | push the schema straight to the DB (no migration files) |
| `drizzle-kit pull` | introspect an existing database into a schema file |
| `drizzle-kit check` | check the consistency of the migration files |
| `drizzle-kit up` | apply migrations (used by `up` / deploy flows) |
| `drizzle-kit drop` | drop the database |
| `drizzle-kit export` | export the schema as SQL |
| `drizzle-kit introspect` | introspect a database |
| `drizzle-kit studio` | open Drizzle Studio to browse and edit data |

## Configuration

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
```

- `schema` — path(s) to the schema file(s), or a glob.
- `out` — where migration files are written.
- `dialect` — `postgresql` | `mysql` | `sqlite` | `turso` | `singlestore`.
- `dbCredentials` — where to connect.
- `strict` / `verbose` — prompt before destructive operations.

## Typical workflow

```sh
drizzle-kit generate      # 1. edit schema → generate SQL
drizzle-kit migrate      # 2. apply to the database
```

`push` skips step 1 and applies the schema directly — convenient in development, but it produces **no migration history**, so use `generate` + `migrate` in production.

## Programmatic migrator

```ts
import { migrate } from 'drizzle-orm/node-postgres/migrator'

await migrate(db, { migrationsFolder: './drizzle' })
```

## Drizzle Studio

```sh
drizzle-kit studio
```

Browses and edits the data of your database — a local alternative to a full admin UI.

<!--
Source references:
- https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-kit/README.md
- https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-kit/src/cli/validations/common.ts
- https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/migrator.ts
-->
