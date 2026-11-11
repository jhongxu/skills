---
name: best-practices
description: Hono best practices - avoid controller-style handlers, structure larger apps, security notes, and the v4 to v5 migration checklist.
---

# Best Practices

## Don't create "Controllers"

Write handlers directly after the route definition — it keeps path-param and return types inferrable.

```ts
// 🙁 controller-style: c.req.param('id') loses its type
const bookPermalink = (c: Context) => c.json(`get ${c.req.param('id')}`)

// 😃 inline: types flow
app.get('/books/:id', (c) => c.json(`get ${c.req.param('id')}`))
```

If you really want controllers, use `factory.createHandlers()` from `hono/factory` — it preserves inference.

## Structure a larger app

Use `app.route()` and split by resource:

```ts
// authors.ts
const authors = new Hono()
authors.get('/', (c) => c.json('list authors'))
authors.get('/:id', (c) => c.json(`get author ${c.req.param('id')}`))

// index.ts
const app = new Hono()
app.route('/authors', authors)
```

## Keep handlers thin

Extract business logic into plain, testable functions; the handler only adapts HTTP → function → HTTP.

## Security

- **Validate every input** with a validator — never trust `c.req.json()` / `c.req.param()`.
- **Authenticate and authorize in every handler or middleware** that touches protected data. Middleware that only optimistically checks is not authorization.
- Keep secrets in `c.env`, never in `NEXT_PUBLIC_`-style public vars or inlined constants.
- Set security headers (`secureHeaders()`), and add CORS explicitly (`cors()`) rather than leaving the default `*`.
- Rate-limit or use `bodyLimit` on public endpoints.
- `HTTPException` for error responses; never leak stack traces — handle them in `app.onError`.

## Testing

- `app.request()` for unit tests, `testClient(app)` for typed tests.
- Keep the app free of runtime-specific APIs in the handler body so the same app can be tested on plain Node/Vitest.

## v4 → v5 migration checklist

Hono v5 is currently a release candidate (`npm install hono@next`); v4.x is the stable line.

| Change | v4 | v5 |
|---|---|---|
| Module format | ESM + CJS | **ESM only** (CJS build removed) |
| Node.js requirement | 18+ | **22.12+** (needed for `require(esm)`) |
| Runtime adapters | `hono/cloudflare-workers` | `@hono/cloudflare-workers` (separate package) |
| Package layout | core + adapters bundled | core stays small, adapters split out |

Read the official migration guide before upgrading — the site documents every breaking change.

<!--
Source references:
- https://hono.dev/docs/guides/best-practices
- https://hono.dev/docs/guides/migrating-to-v5
- https://hono.dev/docs/middleware/builtin/secure-headers
- https://hono.dev/docs/guides/data-security
-->
