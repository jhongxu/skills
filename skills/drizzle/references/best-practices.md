---
name: best-practices
description: Drizzle best practices - transactions, batch operations, error handling with DrizzleQueryError, SQL injection safety, performance and schema conventions.
---

# Best Practices

## Transactions

```ts
await db.transaction(async (tx) => {
  await tx.insert(accounts).values({ balance: 100 })
  await tx.update(accounts).set({ balance: 0 })
})
```

The callback receives a `tx` handle with the same API as `db`. Throw to roll back.

## Batch

```ts
await db.batch([
  db.insert(users).values({ name: 'a' }),
  db.update(users).set({ active: true }).where(eq(users.id, 1)),
  db.delete(users).where(eq(users.id, 2)),
])
```

Batch sends the statements together — much faster than awaiting them one by one. Use it for bulk work.

## Error handling

Since v0.44, Drizzle wraps driver errors in a **`DrizzleQueryError`** that adds:

1. a stack trace pointing at the exact query that failed,
2. the generated SQL string and its parameters,
3. the original driver stack trace.

Catch it to log the SQL safely (it may contain sensitive values).

## SQL injection safety

- Always use the `sql` template tag for raw SQL and interpolate **values** — never build SQL strings by concatenation.
- Use `inArray()` / `notInArray()` instead of manual `IN (...)` strings.
- Identifiers (table/column names) cannot be parameterized — map them through an allow-list if they come from user input.

## Schema conventions

- Keep the schema in one module (`src/db/schema.ts`) — Drizzle Kit diffs it against the snapshot.
- Use `pgTableCreator` for consistent prefixes when splitting the schema across files.
- Prefer explicit SQL column names (`text('first_name')`) so renames are visible in the diff.
- Add indexes for columns you filter or sort on; Drizzle does not create them for you.
- Put constraints in the table's extra-config array so they appear in the migration.

## Migrations

- Use `generate` + `migrate` in production — `push` skips migration history.
- Commit the generated SQL and the snapshots.
- Run `drizzle-kit check` in CI to catch inconsistent migrations.

## Performance

- Select only the columns you need; `db.select()` without an argument pulls every column.
- Use the relational builder for nested reads; use explicit joins when you need a flat shape.
- Batch writes.
- `numeric`/`bigint` are returned as strings by default (precision safety) — configure the mode explicitly if you need numbers.

<!--
Source references:
- https://github.com/drizzle-team/drizzle-orm/blob/main/changelogs/drizzle-orm/0.44.0.md
- https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/errors.ts
-->
