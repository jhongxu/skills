---
name: features-jsx-testing
description: Hono JSX/SSR with hono/jsx, server-side rendering, and testing Hono apps with app.request, testClient and Vitest.
---

# JSX & Testing

## JSX / SSR

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx"
  }
}
```

Or with pragma comments:

```ts
/** @jsx jsx */
/** @jsxImportSource hono/jsx */
```

For Deno use `deno.json` with `"jsx": "precompile"` and `"jsxImportSource": "@hono/hono/jsx"`.

```tsx
import { Hono } from 'hono'
import type { FC } from 'hono/jsx'

const app = new Hono()

const Layout: FC = (props) => (
  <html>
    <body>{props.children}</body>
  </html>
)

app.get('/', (c) => c.html(<Layout><h1>Hello!</h1></Layout>))
```

- The entry file must be `.tsx` — update the dev script accordingly (`bun run --hot src/index.tsx`).
- `hono/html`'s `html` tag also works inside JSX, and `raw()` marks a string as unescaped.
- `hono/jsx/dom` renders on the client side.
- `hono/ssg` generates static pages from a Hono app.

## Testing

### app.request

```ts
import { describe, test, expect } from 'vitest'

describe('Example', () => {
  test('GET /posts', async () => {
    const res = await app.request('/posts')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Many posts')
  })
})
```

`app.request(path, options)` builds a `Request` and runs it through the app — no server needed.

### Typed test client

```ts
import { testClient } from 'hono/testing'

const client = testClient(app)
const res = await client.posts.$get()
```

### Runtime-specific setup

- **Cloudflare Workers**: Vitest + `@cloudflare/vitest-pool-workers` / `@cloudflare/vitest-plugin`.
- **Node.js / Bun / Deno**: the default Vitest setup works; `@hono/node-server` is only needed for a real server.

### The Hono CLI (built for coding agents)

```sh
npm install -D @hono/cli
```

| Command | What it does |
|---|---|
| `hono routes [file]` | show the routes of your app |
| `hono request [path] [file]` | send a request through `app.request()` |
| `hono benchmark [file]` | benchmark the app |
| `hono ssg [file]` | static site generation |
| `hono snapshot [file]` | print a batch of JSONL snapshots |

- It loads the app **directly** — no server process needed.
- Output is **JSON by default**: `{"ok": true, "data": ...}` on success (exit 0), `{"ok": false, "error": { code, message, suggestions, docs }}` on failure (exit 1). Logs go to stderr.
- `routes`, `request`, `benchmark` and `ssg` accept `--plain` for human-readable output.
- `hono --help` starts with a short note aimed at coding agents.

<!--
Source references:
- https://hono.dev/docs/guides/jsx
- https://hono.dev/docs/guides/testing
- https://hono.dev/docs/helpers/testing
- https://hono.dev/docs/agents/cli
-->
