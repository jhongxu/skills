---
name: advanced-react-dom
description: react-dom client and server APIs - createRoot, hydrateRoot, portals, flushSync, resource preloading hints, useFormStatus, and server/static rendering.
---

# React DOM APIs

Most apps use a framework (Next.js, Remix, ...) that handles the DOM APIs below. Reach for them directly in plain Vite/CRA-style apps.

## Client roots

```tsx
import { createRoot } from 'react-dom/client'

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
```

- One root per app; `createRoot` **replaces** the container's existing content.
- Call `root.unmount()` to tear down.

```tsx
import { hydrateRoot } from 'react-dom/client'

hydrateRoot(document.getElementById('root')!, <App />)
```

- Hydration attaches React to server-rendered HTML. The markup must match — mismatches produce a recoverable error.
- Options: `identifierPrefix` (must match the server), `onRecoverableError`, `onCaughtError`, `onUncaughtError`, `formState` (for `useActionState` + `permalink` progressive enhancement).

## Portals

```tsx
const modal = createPortal(<Modal onClose={close} />, document.body)
```

- Renders children into a different DOM node while keeping them **logically** inside the React tree.
- Events propagate through the **React** tree, not the DOM tree — a click inside the portal bubbles to the React parent. Stop propagation or relocate the portal if that is a problem.
- `domNode` must already exist; changing it later recreates the content.

## flushSync

```tsx
flushSync(() => {
  setValue(input)
  inputRef.current?.setSelectionRange(0, 5)
})
```

- Forces React to flush pending updates **synchronously** so the DOM is up to date immediately.
- **Last resort** — it can significantly hurt performance, may show Suspense fallbacks again, and can run pending effects early. It also cancels an in-flight View Transition.

## Resource preloading hints

Call these while rendering to start fetching resources early:

| API | Purpose |
|---|---|
| `preload(href, { as, crossOrigin?, referrerPolicy?, integrity? })` | fetch a stylesheet/font/script/image |
| `preinit(href, { as, ... })` | fetch **and** initialize (execute/apply) the resource |
| `preloadModule(href, { as: 'script', ... })` | fetch an ESM module without executing |
| `preinitModule(href, { as: 'script', ... })` | fetch **and** execute an ESM module |
| `preconnect(href)` | open a connection (preconnect) to an origin |
| `prefetchDNS(href)` | resolve DNS for an origin |

- In the browser they can be called anywhere; **during SSR / Server Component rendering they only take effect if called while rendering a component** (or in an async context started from rendering).
- `as` values: `audio`, `document`, `embed`, `fetch`, `font`, `image`, `object`, `script`, `style`, `track`, `video`, `worker`.
- `crossOrigin: 'anonymous'` is required when `as: 'fetch'`.
- Frameworks usually do this for you.

## Forms

```tsx
const [state, dispatchAction, isPending] = useActionState(action, initialState)

<form action={dispatchAction}>
  <input name="email" />
  <Submit />
</form>
```

`useFormStatus` (from `react-dom`) reports the status of the **nearest parent `<form>`**:

```tsx
import { useFormStatus } from 'react-dom'

function Submit() {
  const { pending, data, method } = useFormStatus()
  return <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
}
```

- `pending` — true while the form is submitting an Action or a Transition.
- `data` — the submitted `FormData` (null if no active submission).
- `method` — `'get'` or `'post'`.
- It must be rendered **inside** the `<form>`.

## Server rendering (react-dom/server)

| API | Use |
|---|---|
| `renderToPipeableStream(node, options)` | Node.js streaming SSR — the standard choice |
| `renderToReadableStream(node, options)` | Web Streams SSR (workers, edge runtimes) |
| `renderToString(node)` | simple string HTML; no streaming, no suspense |
| `prerender(node, options)` | static HTML generation (Web Streams; `prerenderToNodeStream` for Node) |

- Streaming SSR supports **Suspense**: the shell is sent first, then each boundary's content as it resolves.
- Options include `bootstrapScriptContent` / `bootstrapScripts` / `bootstrapModules`, `identifierPrefix`, `onError`, `nonce`, `importMap`, `maxHeadersLength`.
- `formState` must be threaded from the server renderer to `hydrateRoot` when using `useActionState` with a `permalink`.

## Errors

- Catch rendering errors with an **Error Boundary** (`class X extends Component` with `componentDidCatch` / `getDerivedStateFromError`). Error Boundaries must be class components.
- Do not use `try/catch` around children in render — the `error-boundaries` lint flags it.

<!--
Source references:
- https://react.dev/reference/react-dom/client/createRoot
- https://react.dev/reference/react-dom/client/hydrateRoot
- https://react.dev/reference/react-dom/createPortal
- https://react.dev/reference/react-dom/flushSync
- https://react.dev/reference/react-dom/preload
- https://react.dev/reference/react-dom/preinit
- https://react.dev/reference/react-dom/preconnect
- https://react.dev/reference/react-dom/prefetchDNS
- https://react.dev/reference/react-dom/hooks/useFormStatus
- https://react.dev/reference/react-dom/server/renderToPipeableStream
- https://react.dev/reference/react-dom/static/prerender
-->
