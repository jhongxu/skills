---
name: core-routing
description: Hono routing - path parameters, optional and regexp params, chaining, sub-app grouping, base paths, host-based routing, and route priority.
---

# Routing

## Basic

```ts
app.get('/', (c) => c.text('GET /'))
app.post('/', (c) => c.text('POST /'))
app.all('*', (c) => c.text('any'))
app.on(['GET', 'POST'], '/multi', (c) => c.text('multi'))
```

Handlers can be **chained**:

```ts
app
  .get('/endpoint', (c) => c.text('GET /endpoint'))
  .post('/endpoint', (c) => c.text('POST /endpoint'))
```

## Path parameters

```ts
app.get('/user/:name', (c) => c.text(c.req.param('name')))
app.get('/posts/:id/comment/:commentId', (c) => {
  const { id, commentId } = c.req.param()   // all params at once
})
```

| Pattern | Matches |
|---|---|
| `/:name` | one segment |
| `/:name?` | optional segment |
| `/:id{[0-9]+}` | regexp-constrained segment |
| `/:filename{.+\\.png}` | segment containing slashes |

## Priority

Handlers and middleware run in **registration order**, and the first matching handler wins — the rest are not dispatched.

```ts
app.get('/book/a', (c) => c.text('a'))        // GET /book/a → a
app.get('/book/:slug', (c) => c.text('common')) // GET /book/b → common

app.get('*', (c) => c.text('common'))          // ← registered first: it wins!
app.get('/foo', (c) => c.text('foo'))          // never reached
```

Register specific routes **before** wildcards.

## Grouping & base paths

```ts
const book = new Hono()
book.get('/', (c) => c.text('List Books'))     // GET /
book.get('/:id', (c) => c.text('Get Book'))

const app = new Hono()
app.route('/book', book)                       // GET /book, GET /book/:id
```

`app.route()` does **not** change the sub-app's own base path. To keep it:

```ts
const user = new Hono().basePath('/user')
app.route('/api', user)                       // GET /api/user
```

`new Hono().basePath('/api')` sets the base path for the whole app.

## Host-based routing

```ts
const app = new Hono({
  getPath: (req) => req.url.replace(/^https?:\/\/([^?]+).*$/, '$1'),
})

app.get('/www1.example.com/hello', (c) => c.text('hello www1'))
```

With a `host` header instead of the URL host, use the `getPath` variant that reads `req.headers.get('host')`.

## 404 and error handling

```ts
app.notFound((c) => c.text('Not Found', 404))
app.onError((err, c) => c.text('Error!', 500))
```

## Mounting another app

```ts
app.mount('/sub', subApp)
```

Use `app.route()` for Hono sub-apps (keeps types), `app.mount()` for generic sub-apps (e.g. a different framework).

<!--
Source references:
- https://hono.dev/docs/api/routing
- https://hono.dev/docs/api/hono
-->
