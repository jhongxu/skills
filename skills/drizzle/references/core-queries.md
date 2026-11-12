---
name: core-queries
description: Drizzle query builders - select, insert, update, delete, where clauses, joins with nested partial select, groupBy, orderBy, limit, sql template, subqueries, alias and aggregate functions.
---

# Queries

Drizzle gives you two styles: **SQL-like** query builders and the **relational** query builder (see relations).

## Select

```ts
const rows = await db
  .select({ id: users.id, name: users.name })
  .from(users)
  .where(eq(users.name, 'Ada'))
  .orderBy(desc(users.createdAt))
  .limit(10)
```

Chainable: `.from()`, `.where()`, `.having()`, `.groupBy()`, `.orderBy()`, `.limit()`, `.offset()`, `.leftJoin()`, `.rightJoin()`, `.innerJoin()`, `.fullJoin()`, `.as()`.

Omit `.select()`'s argument to select everything:

```ts
const rows = await db.select().from(users)
```

### Joins with partial select

Joining flattens columns and nullifies the joined table's fields. **Group a table's fields in a nested object** to keep them typed and null-checkable as one unit:

```ts
const rows = await db
  .select({
    cityId: cities.id,
    cityName: cities.name,
    user: {                    // ← nested object
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
    },
  })
  .from(cities)
  .leftJoin(users, eq(users.cityId, cities.id))
// → { cityId: number; cityName: string; user: { id: number; firstName: string; lastName: string | null } | null }
```

The single-null-check optimization applies when **all fields of the nested object belong to the same table**. You can also pass a table directly: `.select({ cities, user: { firstName: users.firstName } })`.

Without a nested object the type is `{ cityId: number; userId: number | null; ... }` — every joined field is nullable individually.

## Insert

```ts
await db.insert(users).values({ name: 'Ada', email: 'ada@example.com' })
await db.insert(users).values([{ ... }, { ... }])       // batch insert
await db.insert(users).values({ ... }).onConflictDoNothing()
await db.insert(users).values({ ... })
  .onConflictDoUpdate({ target: users.email, set: { name: 'Ada' } })
await db.insert(users).values({ ... }).returning()
```

## Update

```ts
await db.update(users).set({ name: 'Ada' }).where(eq(users.id, 1))
await db.update(users).set({ name: 'Ada' }).where(eq(users.id, 1)).returning()
```

## Delete

```ts
await db.delete(users).where(eq(users.id, 1))
await db.delete(users).where(eq(users.id, 1)).returning()
```

## Where conditions

```ts
import { eq, ne, gt, gte, lt, lte, and, or, not, isNull, isNotNull, like, ilike, inArray, notInArray, between, exists } from 'drizzle-orm'

where(and(eq(users.active, true), gt(users.age, 18)))
where(or(eq(users.role, 'admin'), eq(users.role, 'owner')))
```

## Raw SQL

```ts
import { sql } from 'drizzle-orm'

const rows = await db
  .select({ name: users.name, count: sql<number>`count(*)` })
  .from(users)
  .groupBy(users.name)
  .having(sql`count(*) > ${1}`)
```

`sql` is a **template tag** — interpolate values as parameters, never as raw strings, to stay injection-safe.

## Aggregate functions

```ts
import { count, countDistinct, sum, sumDistinct, avg, max, min } from 'drizzle-orm'

const [total] = await db.select({ value: count() }).from(users)
```

## Aliases and subqueries

```ts
import { alias } from 'drizzle-orm'

const u = alias(users, 'u')
await db.select().from(u).where(eq(u.id, 1))
```

```ts
import { subquery, exists } from 'drizzle-orm'

const activeUsers = db.select({ id: users.id }).from(users).where(eq(users.active, true)).as('active')
await db.select().from(users).where(exists(activeUsers))
```

<!--
Source references:
- https://github.com/drizzle-team/drizzle-orm/blob/main/docs/joins.md
- https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/pg-core/query-builders/
- https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/sql/functions/aggregate.ts
-->
