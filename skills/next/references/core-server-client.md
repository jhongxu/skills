---
name: core-server-client
description: Next.js Server and Client Components, the 'use client' and 'use server' directives, the server/client boundary, and composition patterns.
---

# Server & Client Components

**Layouts and pages are Server Components by default.** Add `'use client'` only where you need interactivity.

## When to use which

**Client Component** (`'use client'`) — needs:
- state and event handlers (`onClick`, `onChange`)
- lifecycle logic (`useEffect`)
- browser-only APIs (`localStorage`, `window`, `navigator`)
- custom hooks that use the above

**Server Component** (default) — needs:
- data access close to the source (DB, API, filesystem)
- secrets (API keys, tokens) that must not reach the browser
- less JavaScript in the browser, better FCP, progressive streaming

## The boundary

- `'use client'` marks an **entry point** for the client. Everything imported by that module becomes client code too.
- It goes at the **very top of the file**, before imports; it cannot be inside a function.
- You do **not** need `'use client'` on every file that contains a client component — only on the files imported directly by a Server Component.
- Props passed from a Server Component to a Client Component must be **serializable**.
- A Client Component cannot import a Server Component. The dependency direction is Server → Client.

## Composition patterns

**Pattern 1 — pass server-rendered content as a prop:**

```tsx
// Server Component
<ClientShell>
  <ServerRenderedList />   {/* rendered on the server, passed as children */}
</ClientShell>
```

**Pattern 2 — keep the client boundary as low as possible:**

```tsx
// Server Component
<SearchResults results={await search(q)} />   {/* server work */}
<LikeButton postId={id} />                   {/* tiny client leaf */}
```

**Pattern 3 — shared context from a client provider:**

```tsx
'use client'
export const ThemeContext = createContext(null)
export function ThemeProvider({ children }) { /* ... */ }
```

```tsx
// Server Component — import the provider from the client module and render it
import { ThemeProvider } from './theme-provider'
<ThemeProvider>{children}</ThemeProvider>
```

**Pattern 4 — server action from a client component:**

```tsx
// actions.ts
'use server'
export async function createPost(formData: FormData) { /* ... */ }
```

```tsx
'use client'
import { createPost } from './actions'
<form action={createPost}><button>Create</button></form>
```

## Reducing the client bundle

- Keep `'use client'` boundaries **low in the tree** — a boundary at the root ships the whole subtree's interactivity to the browser.
- Do not mark a whole `layout.tsx` as client just to use one stateful widget.
- Server Components can render Client Components; the reverse is impossible — restructure instead of marking files `'use client'`.
- A component that only receives `children` and renders them can stay a Server Component even when used inside a client tree.

## Server Functions (`'use server'`)

- Define with `'use server'` at the top of an **async** function or file.
- Cannot be defined inside a Client Component — define in a separate `'use server'` file and import it.
- They are reachable via **direct POST requests**, so **always authenticate and authorize inside every Server Function**.
- Use `<form action={serverAction}>` for progressive enhancement (works without JS).

<!--
Source references:
- https://nextjs.org/docs/app/getting-started/server-and-client-components
- https://nextjs.org/docs/app/api-reference/directives/use-client
- https://nextjs.org/docs/app/api-reference/directives/use-server
- https://nextjs.org/docs/app/guides/server-and-client-boundary
-->
