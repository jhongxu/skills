---
name: advanced-rsc
description: React Server Components, the 'use client' and 'use server' directives, Server Functions, and the cache API.
---

# React Server Components

Server Components render **before bundling**, in a separate environment from the client app or the SSR server. They can run at build time (CI) or per request (web server).

- The component itself never ships to the client — only its rendered output does. A server component can import heavy libraries (a Markdown renderer, a database client) without adding them to the client bundle.
- Server Components can be **async** and `await` inside render.
- They can read the filesystem, query a database, or fetch data — no API layer and no client-side Effect needed.
- RSC requires a **compatible framework/bundler** (Next.js App Router, Remix, etc.). The underlying bundler APIs do **not** follow semver in React 19.x — pin the React version or use Canary.

## `'use client'`

Marks a module (and its transitive dependencies) as client code:

```tsx
'use client'

export function Counter() { /* runs in the browser */ }
```

- Must be the **very first statement** in the file, above imports (comments are allowed above it).
- Creates a **boundary**: everything imported *by* that module is also evaluated on the client.
- A module can be evaluated on the server when imported from server code and on the client when imported from client code.
- Server Components **cannot create context**, but they can render a context provider imported from a `'use client'` module. The client components under it read the value with `use`/`useContext`.

## `'use server'`

Marks a module or function as a **Server Function** — an async function that runs on the server:

```tsx
'use server'

export async function createUser(formData: FormData) {
  const user = await db.user.create({ email: formData.get('email') })
  return user
}
```

- Arguments and return values must be **serializable** (plain objects, arrays, strings, numbers). Non-serializable values are rejected (or encrypted when `serverActions.encryptionKey` is configured).
- Server Functions can be passed as props and used as a `<form action={...}>`.
- With `useActionState` + a `permalink`, the form works **before the JS bundle loads** — the browser navigates to the permalink and the server renders the submitted state.
- They are remote calls: treat them as a network boundary (validate input, authenticate, rate-limit).

## `cache`

```tsx
import { cache } from 'react'

const getUser = cache(async (id: string) => db.user.findUnique({ where: { id } }))
```

- Memoizes a function **per server request** — repeated calls with the same arguments reuse the result.
- The cache is invalidated for every request.
- Each `cache(fn)` call creates a **new** memoized function; wrap once at module scope, not inside a component.
- Errors are cached too.
- Use it to avoid duplicate data fetches within a single render pass.

## Server vs Client boundaries

- Data fetched in a Server Component is passed to Client Components as **props** — it must be serializable.
- A Client Component cannot import a Server Component; the boundary goes the other way: Server → Client.
- Context created in a `'use client'` module can be consumed by client components under a provider rendered from a server component.

<!--
Source references:
- https://react.dev/reference/rsc/server-components
- https://react.dev/reference/rsc/use-client
- https://react.dev/reference/rsc/use-server
- https://react.dev/reference/rsc/server-functions
- https://react.dev/reference/react/cache
-->
