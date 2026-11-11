---
name: core-concepts
description: TanStack Router core concepts - route trees, the root route, createFileRoute/createRoute, code-based routing, router context, and type safety.
---

# Concepts

A router for React (and Solid) with **100% inferred TypeScript**, typesafe navigation, nested routing, route loaders with SWR caching, automatic prefetching, and file-based route generation.

## Route trees

Routes form a **nested tree** that mirrors the URL:

```
/blog/posts/123
├── blog
│   ├── posts
│   │   └── $postId
```

renders as nested components:

```tsx
<Blog><Posts><Post postId="123" /></Posts></Blog>
```

## The root route

The top-most route, wrapping everything. It is the only route created with `createRootRoute`:

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <>
      <h1>My App</h1>
      <Outlet />
    </>
  ),
})
```

- Use `createRootRouteWithContext<T>()` when the root route carries **context** (see below).
- The root route is where you put `<HeadContent />`, global error boundaries, and the app shell.

## Route definitions

```tsx
// src/routes/posts.$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  component: PostComponent,
  loader: ({ params }) => fetchPost(params.postId),
})
```

The path string is **automatically written and maintained** by the Router bundler plugin or the Router CLI when you move/rename files. It exists purely so TypeScript knows which file it is.

## Code-based routing

```tsx
import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'

const rootRoute = createRootRoute()
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexComponent,
})

const routeTree = rootRoute.addChildren([indexRoute])
const router = createRouter({ routeTree })
```

⚠️ In code-based routing you **must** pass `getParentRoute` to every child route — otherwise the parent types (search params, context) are lost.

## Creating the router

```tsx
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function createAppRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
  })
}
```

## Router context

The context is merged down the route tree — the classic **dependency injection** mechanism:

```tsx
const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: ({ context }) => ({ queryClient }),
})
```

Each route can add to the context in its `beforeLoad`; children see the merged result.

## Type safety

- File-based routing: types are generated for you.
- Code-based routing: set `getParentRoute` on every child.
- Top-level exports (`Link`, `useNavigate`, `useParams`) pick up the router's types through the generated `Register` interface — import the generated `routeTree.gen.ts` so the registration happens.

<!--
Source references:
- https://tanstack.com/router/latest/docs/framework/react/overview
- https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts
- https://tanstack.com/router/latest/docs/framework/react/routing/route-trees
- https://tanstack.com/router/latest/docs/framework/react/guide/creating-a-router
- https://tanstack.com/router/latest/docs/framework/react/guide/router-context
- https://tanstack.com/router/latest/docs/framework/react/guide/type-safety
-->
