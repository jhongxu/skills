---
name: core-navigation
description: TanStack Router navigation - Link, useNavigate, ToOptions, from/to, path params, search params with validation, linkOptions, and navigation blocking.
---

# Navigation

## Everything is relative

Every navigation has an **origin** (`from`) and a **destination** (`to`). If you don't pass `from`, the router assumes you are at `/` and only autocompletes absolute paths.

```tsx
<Link to="/posts/$postId" params={{ postId: '123' }}>Post</Link>
<Link to=".">Current</Link>          {/* relative to the current route */}
<Link to="../sibling">Sibling</Link>
```

## Link

```tsx
import { Link } from '@tanstack/react-router'

<Link
  to="/posts"
  search={{ page: 1 }}
  hash="section"
  state={{ from: 'home' }}
  params={{ id }}
  activeProps={{ className: 'active' }}
  preload="intent"
>
  Posts
</Link>
```

## Imperative navigation

```tsx
const navigate = useNavigate()

navigate({ to: '/posts', search: { page: 2 } })
navigate({ to: '/posts', replace: true })
navigate({ to: '/posts', resetScroll: false })
```

`redirect()` is the same thing for use in loaders/beforeLoad.

## linkOptions

Reusable navigation options must be created with `linkOptions()` so they are type-checked **before** being spread into a `Link`:

```tsx
import { linkOptions } from '@tanstack/react-router'

const dashboardLinkOptions = linkOptions({
  to: '/dashboard',
  search: { search: '' },
})

<Link {...dashboardLinkOptions}>Dashboard</Link>
```

A plain object literal infers `to` as `string`, which resolves to *every* route — and errors only surface when spread into `Link`.

## Path params

```tsx
const { postId } = Route.useParams()
// or, from any component:
const params = useParams({ strict: false })
```

## Search params

Search params are **JSON-first** and typed. Validate them on the route:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const Route = createFileRoute('/posts')({
  validateSearch: z.object({ page: z.number().default(1) }),
})

const search = Route.useSearch()
```

Without a validator, search params are `unknown`-ish; with one they are fully typed and defaults apply.

For non-Zod schemas use `createSearchParams` / standard-schema validators.

### Custom serialization

By default search params are serialized with `JSON.stringify`. Override with `parseSearchWith` / `stringifySearchWith` on the router — useful for arrays, dates and nested objects.

## Navigation blocking

```tsx
const blocker = useBlocker({
  blockerFn: () => !isSaved,
})

if (blocker.status === 'blocked') {
  return <ConfirmDialog onConfirm={() => blocker.proceed()} onCancel={() => blocker.reset()} />
}
```

Use it for unsaved changes, in-progress forms and payments.

## Preloading

`<Link preload="...">` strategies:

| Strategy | Triggers when |
|---|---|
| `intent` | hover / touch start on the link |
| `viewport` | the link enters the viewport (IntersectionObserver) |
| `render` | the link is rendered |
| `false` | never |

`defaultPreload: 'intent'` on the router sets the app-wide default.

<!--
Source references:
- https://tanstack.com/router/latest/docs/framework/react/guide/navigation
- https://tanstack.com/router/latest/docs/framework/react/guide/link-options
- https://tanstack.com/router/latest/docs/framework/react/guide/path-params
- https://tanstack.com/router/latest/docs/framework/react/guide/search-params
- https://tanstack.com/router/latest/docs/framework/react/guide/navigation-blocking
- https://tanstack.com/router/latest/docs/framework/react/guide/preloading
-->
