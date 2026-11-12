---
name: core-relations
description: Drizzle relational queries - defining relations with one and many, and the db.query API with findMany, findFirst, where, with and nested relations.
---

# Relations

## Defining relations

```ts
import { relations } from 'drizzle-orm'

export const usersRelations = relations(users, ({ one, many }) => ({
  city: one(cities, {
    fields: [users.cityId],
    references: [cities.id],
  }),
  posts: many(posts),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}))
```

- `one(...)` — the "one" side (a foreign key on this table).
- `many(...)` — the "many" side (the other table has the foreign key).
- `relationName` disambiguates when there are **multiple relations between the same two tables**.

## The relational query builder

```ts
const result = await db.query.users.findMany({
  where: eq(users.active, true),
  orderBy: [desc(users.createdAt)],
  limit: 10,
  with: {
    posts: true,
    city: { columns: { name: true } },
  },
})

const one = await db.query.users.findFirst({
  where: eq(users.id, 1),
  with: { posts: { with: { author: true } } },
})
```

- `with` accepts a boolean, a nested object, or an array of nested objects for multiple relations.
- `columns` selects a subset of columns.
- `where` uses the same condition helpers as the SQL builder.
- `db.query.<table>.findMany()` returns fully typed nested results.

## RQB vs SQL builder

| | SQL builder | Relational query builder |
|---|---|---|
| Style | SQL-like, explicit joins | Nested, object graph |
| Access | `db.select().from(users)` | `db.query.users.findMany()` |
| Relations | manual `leftJoin` | `with: { ... }` |
| Type of relations | flattened, nullable per column | nested objects, nullable as a unit |

You can mix them — `db.query` for relational reads, the SQL builder for everything else.

## Caveats

- The relational builder returns a **single object per parent row** with children nested; it does not produce one flattened row per join combination.
- `one()` requires the foreign key to be on the source table; use `many()` on the other side.
- Named relations: `one(posts, { relationName: 'authorPosts', fields: [...], references: [...] })`.

<!--
Source references:
- https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/relations.ts
- https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/pg-core/query-builders/query.ts
-->
