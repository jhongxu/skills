---
name: features-cache
description: The Drizzle cache module - opt-in query caching, the Upstash integration, custom Cache implementations and the default non-caching behaviour.
---

# Caching

Introduced in Drizzle v0.44.

By default Drizzle sends every query straight to your database — **no hidden caching, no automatic invalidation**. You always see exactly what runs.

To cache, opt in explicitly:

```ts
import { upstashCache } from 'drizzle-orm/cache/upstash'
import { drizzle } from 'drizzle-orm/node-postgres'

const db = drizzle(process.env.DB_URL!, {
  cache: upstashCache({
    url: '<UPSTASH_URL>',
    token: '<UPSTASH_TOKEN>',
    global: true,        // cache every select, not just opted-in queries
    config: { ex: 60 },  // TTL in seconds
  }),
})
```

- `global: false` (the default) caches **nothing** unless a query asks for it.
- `global: true` makes every select look in the cache first.

## Custom caches

Drizzle exposes the APIs (`get`, `put`, `mutate`, …) so you can implement your own `Cache` subclass — for example with Keyv:

```ts
import Keyv from 'keyv'

export class TestGlobalCache extends Cache {
  private globalTtl: number = 1000
  // implement get / put / mutate …
}
```

## Opting a single query in

```ts
await db.select().from(users).where(eq(users.id, 1))
```

Query-level opt-in (e.g. `.cache()` / cache tags) exists in the API surface — check the cache docs for the current shape.

## When to cache

Only cache when the data is **read-heavy and stale-tolerant**. Writes must invalidate explicitly; a stale cache is worse than no cache.

<!--
Source references:
- https://github.com/drizzle-team/drizzle-orm/blob/main/changelogs/drizzle-orm/0.44.0.md
-->
