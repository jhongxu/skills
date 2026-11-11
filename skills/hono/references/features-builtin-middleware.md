---
name: features-builtin-middleware
description: Hono built-in middleware - cors, jwt, logger, basic-auth, bearer-auth, body-limit, cache, compress, etag, secure-headers, timeout, csrf, ip-restriction and more.
---

# Built-in Middleware

All live under `hono/<name>` and are created by a factory call.

## cors

```ts
import { cors } from 'hono/cors'

app.use('/api/*', cors())
app.use('/api2/*', cors({
  origin: ['https://example.com', 'https://example.org'],
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Authorization'],
  credentials: true,
}))
```

- `origin` accepts a string, an array, or `(origin, c) => string`.
- Defaults: `origin: '*'`, `allowMethods: ['GET','HEAD','PUT','POST','DELETE','PATCH','QUERY']`, `allowHeaders: []`.
- Register CORS **before** the routes it applies to.

## jwt

```ts
import { jwt } from 'hono/jwt'
import type { JwtVariables } from 'hono/jwt'

type Variables = JwtVariables
const app = new Hono<{ Variables: Variables }>()

app.use('/auth/*', jwt({ secret: 'it-is-very-secret', alg: 'HS256' }))
app.get('/auth/page', (c) => c.text(c.get('jwtPayload').sub))
```

- Checks the `Authorization` header (scheme `Bearer` or `Basic`); change the header with `headerName`.
- Read the secret from `c.env` by wrapping it in a middleware:

```ts
app.use('/auth/*', (c, next) => jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })(c, next))
```

## logger

```ts
import { logger } from 'hono/logger'

app.use(logger())
app.use('/admin/*', logger({ prefix: '[admin]' }))
```

## basic-auth / bearer-auth

```ts
import { basicAuth } from 'hono/basic-auth'
import { bearerAuth } from 'hono/bearer-auth'

app.use('/admin/*', basicAuth({ username: 'admin', password: 'secret' }))
app.use('/api/*', bearerAuth({ token: 'my-token' }))
```

## body-limit

```ts
import { bodyLimit } from 'hono/body-limit'

app.use('/upload', bodyLimit({ maxSize: 50 * 1024 }))   // bytes
```

Rejects oversized bodies with 413.

## cache

```ts
import { cache } from 'hono/cache'

app.use('/static/*', cache({ cacheName: 'static', cacheControl: 'max-age=3600' }))
```

## compress, etag, pretty-json

```ts
import { compress } from 'hono/compress'
import { etag } from 'hono/etag'
import { prettyJSON } from 'hono/pretty-json'

app.use(compress())
app.use(etag())
app.use(prettyJSON())
```

## secure-headers

```ts
import { secureHeaders } from 'hono/secure-headers'

app.use(secureHeaders())
```

Sets CSP, X-Frame-Options, HSTS and friends — a good default for every app.

## timeout

```ts
import { timeout } from 'hono/timeout'

app.use('/slow/*', timeout(5000))
```

## ip-restriction

```ts
import { ipRestriction } from 'hono/ip-restriction'

app.use('/admin/*', ipRestriction({ cidrs: ['10.0.0.0/8'] }))
```

## csrf

```ts
import { csrf } from 'hono/csrf'

app.use('/api/*', csrf())
```

## Others worth knowing

| Middleware | Import | Purpose |
|---|---|---|
| `combine` | `hono/combine` | merge multiple middleware into one |
| `context-storage` | `hono/context-storage` | AsyncLocalStorage-based context |
| `jwk` | `hono/jwk` | JWK key management for JWT |
| `jsx-renderer` | `hono/jsx-renderer` | server-side JSX rendering |
| `language` | `hono/language` | i18n negotiation |
| `method-not-allowed` | `hono/method-not-allowed` | 405 handling |
| `method-override` | `hono/method-override` | `X-HTTP-Method-Override` |
| `mount` | `hono/mount` | mount another app |
| `pretty-json` | `hono/pretty-json` | pretty-print JSON responses |
| `request-id` | `hono/request-id` | attach a request id |
| `trailing-slash` | `hono/trailing-slash` | normalize trailing slashes |

Third-party middleware lives in [honojs/middleware](https://github.com/honojs/middleware) (zod-validator, standard-validator, pino, …).

<!--
Source references:
- https://hono.dev/docs/middleware/builtin/cors
- https://hono.dev/docs/middleware/builtin/jwt
- https://hono.dev/docs/middleware/builtin/logger
- https://hono.dev/docs/middleware/builtin/basic-auth
- https://hono.dev/docs/middleware/builtin/bearer-auth
- https://hono.dev/docs/middleware/builtin/body-limit
- https://hono.dev/docs/middleware/builtin/cache
- https://hono.dev/docs/middleware/builtin/compress
- https://hono.dev/docs/middleware/builtin/etag
- https://hono.dev/docs/middleware/builtin/secure-headers
- https://hono.dev/docs/middleware/builtin/timeout
- https://hono.dev/docs/middleware/builtin/ip-restriction
- https://hono.dev/docs/middleware/builtin/csrf
-->
