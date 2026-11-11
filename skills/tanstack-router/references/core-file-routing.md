---
name: core-file-routing
description: TanStack Router file-based routing - file naming conventions, route groups, pathless layouts, params, escaping, index routes, and the generated route tree.
---

# File-Based Routing

File-based routing is the **recommended** way to configure TanStack Router. Routes live in `src/routes/` and the generated `src/routeTree.gen.ts` wires them together.

```
src/routes/
├── __root.tsx          # root route
├── index.tsx           # /
├── about.tsx           # /about
├── posts/
│   ├── index.tsx       # /posts
│   └── $postId.tsx     # /posts/:postId
```

## File naming conventions

| Pattern | Meaning |
|---|---|
| `.` | **nesting** without a directory: `posts.$postId.tsx` nests under `posts` |
| `/` | directory = URL segment |
| `$` prefix | **path parameter**: `$postId` → `/posts/:postId` |
| `_` prefix | **pathless layout route** — does not affect the URL |
| `_` suffix | route is **not** nested under its parent (`posts_.$postId.tsx`) |
| `-` prefix | **excluded** from the route tree — use for colocated helper files |
| `(name)` | **route group** — folder does not appear in the URL |
| `[x]` | **escaping** — `script[.]js.tsx` → `/script.js` |
| `index` | matches the parent path exactly (configurable via `indexToken`) |

### Directory vs `.` nesting

- **Directory** → wide hierarchies: `posts/index.tsx`, `posts/$postId.tsx`.
- **`.`** → few deeply nested routes: `posts.$postId.comments.tsx` nests under `posts`.

### Pathless layouts

`_auth.login.tsx` renders a layout at `/login` without adding a URL segment. Combine with a pathless `_layout.tsx` for shared chrome around a group of routes.

### Route groups

`(marketing)/about.tsx` → `/about`. Use for organization, and to attach a layout to a group without changing URLs.

## Params

```tsx
// src/routes/posts.$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params }) => fetchPost(params.postId),   // params.postId is typed
})
```

Params match a single segment. For multi-segment params, use a splat route (`$.tsx`).

## The generated route tree

`src/routeTree.gen.ts` is **generated** — never edit it by hand; it is rewritten whenever files move. It exports:

```ts
import { routeTree } from './routeTree.gen'
```

The generator is provided by the Vite plugin (`@tanstack/router-plugin`) or the Router CLI (`@tanstack/router-cli`).

## Virtual routes

You can add routes that have no file by augmenting the generated tree — useful for wrapping existing components in error boundaries or lazy boundaries.

## Renaming and moving

The plugin/CLI rewrites the path string inside `createFileRoute(...)` for you when you rename or move a route file — that is why the path is written there in the first place.

<!--
Source references:
- https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing
- https://tanstack.com/router/latest/docs/framework/react/routing/file-naming-conventions
- https://tanstack.com/router/latest/docs/framework/react/routing/route-trees
- https://tanstack.com/router/latest/docs/framework/react/api/file-based-routing
-->
