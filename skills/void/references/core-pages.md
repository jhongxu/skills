---
name: core-pages
description: Void Pages mode - file-based pages with companion .server.ts loaders and actions, layouts, error components, islands, view transitions and link states.
---

# Pages Mode

Put components in `pages/` and they become routes. Pages mode starts when a `pages/` directory exists; it can live alongside `routes/`. The pattern is inspired by Inertia.js and works with React, Vue, Svelte and Solid.

## Setup

```sh
npm install @void/react   # or @void/vue, @void/svelte, @void/solid
```

```ts
// vite.config.ts
import { voidPlugin } from 'void'
import { voidReact } from '@void/react/plugin'

export default defineConfig({
  plugins: [voidPlugin(), voidReact()],
})
```

## Loaders & props

Each page can have a companion `.server.ts` file whose `loader` fetches data:

```ts
// pages/users/index.server.ts
import { defineHandler, type InferProps } from 'void'
import { db } from 'void/db'

export const loader = defineHandler(async (c) => {
  return { users: await db.select().from(users) }
})

export type Props = InferProps<typeof loader>
```

```tsx
// pages/users/index.tsx
import type { Props } from './index.server'

export default function UsersPage({ users }: Props) {
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

- `InferProps` keeps the component in sync with the loader's return type.
- Void **preserves** `Date`, `Map`, `Set`, `bigint`, `RegExp`, `URL`, `undefined`, and repeated/cyclic references through server rendering, hydration, navigation and deferred loading. Return data directly — explicitly returning `Response.json()` falls back to plain JSON conversion.
- Functions and custom class instances **cannot** be sent as page data.

## Actions & forms

```ts
// pages/users/index.server.ts
export const action = defineHandler.withValidator({
  body: insertUserSchema,
})(async (c) => {
  await db.insert(users).values(c.req.valid('body'))
})
```

Actions handle `POST`, `PUT`, `PATCH` and `DELETE`.

| Action returns | Behavior |
|---|---|
| nothing (`void`) | re-runs the loader; the page re-renders with fresh props |
| `c.redirect(url)` | navigates to another page (checked when `routing.typedRoutes` is on; use `as Href` to opt out) |

In the UI, use the adapter's `Form` with `useForm()` — action failures stay visible and the entered data is preserved.

## Layouts & errors

- `pages/layout.tsx` — the root layout (nav, footer).
- `pages/_not-found.tsx` and `pages/_error.tsx` — render inside your layouts; both receive an `error` prop with `status` and `message`. Types come from the adapter package (`ErrorPageProps` from `@void/react`).

## Link states

- Style the current link with `Link`'s `aria-current` and `data-void-active` attributes (`activeMatch="prefix"` for sections) instead of comparing `useRouter().path`.
- Show a loading state on the clicked link with `data-void-pending` instead of matching `useNavigation().location` yourself.

## Islands & view transitions

`docs/guide/pages-routing/islands.md` covers rendering only parts of a page as interactive islands; `view-transitions.md` covers animated route transitions.

<!--
Source references:
- https://void.cloud/guide/pages-routing/overview
- https://void.cloud/guide/pages-routing/loaders
- https://void.cloud/guide/pages-routing/actions-and-forms
- https://void.cloud/guide/pages-routing/layouts
- https://void.cloud/guide/pages-routing/errors
- https://void.cloud/guide/pages-routing/islands
-->
