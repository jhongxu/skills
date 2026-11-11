---
name: features-ssr
description: TanStack Router SSR - server rendering, hydration, the server entry point, and testing router applications.
---

# SSR & Testing

## Server rendering

The router can render on the server and hydrate on the client. Two flavors:

- **Non-streaming SSR** — the whole page is rendered and sent in one HTML request, including the serialized data needed for hydration.
- **Streaming SSR** — the shell is sent first, then the rest streams as it resolves.

> The SSR APIs in the router share internals with TanStack Start, so treat them as **experimental** until Start is stable.

```tsx
import { createRouter } from '@tanstack/react-router'

export function createAppRouter() {
  return createRouter({ routeTree })
}
```

Then render on the server with the router's `createMemoryHistory` and serialize the router state into the HTML so the client can hydrate with the same state.

## Do not mix frameworks

TanStack Router is **not** Next.js, Remix or React Router DOM. Do not use:

- `src/pages/`, `app/layout.tsx`, `_app/index.tsx`
- `getServerSideProps`, `getStaticProps`, `getInitialProps`
- Remix-style `loader`/`action` exports
- imports from `react-router-dom` or `next/`

TanStack uses `src/routes/` with `createFileRoute`, `Link`/`useNavigate`/`redirect` from `@tanstack/react-router`, and (for Start) `createServerFn` from `@tanstack/react-start`. Wrong-framework code usually fails to build or produces conflicting `/` routes at runtime.

## Testing

```sh
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom' },
})
```

For code-based routing, build the router in the test and drive it directly:

```ts
const router = createRouter({ routeTree })
await router.load()
```

For file-based routing, use the generated route tree and render with a `RouterProvider`.

Testing patterns:

- **unit** — test the route config, loaders and helpers in isolation.
- **integration** — render the app with a `RouterProvider` and assert on rendered output.
- **e2e** — drive a real browser against the running app.

<!--
Source references:
- https://tanstack.com/router/latest/docs/framework/react/guide/ssr
- https://tanstack.com/router/latest/docs/framework/react/how-to/setup-testing
- https://tanstack.com/router/latest/docs/framework/react/how-to/test-file-based-routing
-->
