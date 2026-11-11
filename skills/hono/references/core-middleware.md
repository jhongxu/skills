---
name: core-middleware
description: Hono middleware - the onion model, execution order, custom middleware, early return, error handling, and app.use registration.
---

# Middleware

Middleware wraps the handler: it runs **before** and **after**, like onion layers.

```ts
app.use(async (c, next) => {
  const start = performance.now()
  await next()                      // → next middleware / handler
  const ms = performance.now() - start
  c.header('X-Response-Time', `${ms}ms`)
})
```

## The contract

- A **Handler** returns a `Response`. Only one handler runs.
- A **Middleware** calls `await next()` and returns **nothing** — that continues the chain.
- A **Middleware** that **returns a `Response`** short-circuits: the rest of the chain is skipped and the response is sent.

```ts
app.use('/admin/*', async (c, next) => {
  if (!isAuthorized(c)) return c.text('Forbidden', 403)   // early exit
  await next()
})
```

## Registration

```ts
app.use(logger())                 // all methods, all routes
app.use('/posts/*', cors())       // path-scoped
app.use('*', logger())            // wildcard
app.get('/x', middleware, handler) // middleware attached to one route
```

## Execution order

Order follows **registration order**. The pre-`next` part runs first→last; the post-`next` part unwinds last→first.

```ts
app.use(async (_, next) => { console.log('1 start'); await next(); console.log('1 end') })
app.use(async (_, next) => { console.log('2 start'); await next(); console.log('2 end') })
app.get('/', (c) => c.text('handler'))
```

```
1 start → 2 start → handler → 2 end → 1 end
```

With `logger() → cors() → basicAuth() → handler`, middleware registered earlier wraps the later ones.

## Custom middleware

```ts
type MiddlewareHandler = (c: Context, next: Next) => Promise<Response | void>

const timing: MiddlewareHandler = async (c, next) => {
  await next()
}

app.use(timing)
```

Type it with `MiddlewareHandler` from `hono` so `next` and `c` stay inferred.

## Passing values to handlers

```ts
app.use(async (c, next) => {
  c.set('message', 'Hono is cool!!')
  await next()
})

app.get('/', (c) => c.text(c.get('message')))
```

Declare the `Variables` type on the `Hono` generic to get type-safe `c.get`/`c.set`.

## Errors in middleware

- Throwing inside middleware propagates to `app.onError`.
- `HTTPException` is the idiomatic way to abort with a status code.
- If you `await next()` and the handler throws, the error bubbles up through your middleware — catch it there if you want to log or transform it, then rethrow.

## Gotchas

- A middleware that forgets `await next()` silently stops the chain — the handler never runs.
- A middleware that returns a value **without** awaiting `next()` short-circuits.
- Path matching: `app.use('/posts/*')` covers `/posts/1`; `app.use('/posts')` matches only that exact path.

<!--
Source references:
- https://hono.dev/docs/concepts/middleware
- https://hono.dev/docs/guides/middleware
-->
