---
name: best-practices
description: Next.js production checklist, security and authentication patterns, debugging, and the version-matched bundled documentation for AI agents.
---

# Best Practices

## Production checklist

**Server Components by default.** Keep `'use client'` boundaries low; a boundary at the root ships the whole tree's interactivity.

**Data & rendering**

- Fetch in Server Components, next to the data source. Never call your own Route Handler from a Server Component.
- Wrap request-time APIs (`cookies`, `headers`, `searchParams`) in `<Suspense>` so the rest of the route stays prerendered.
- Cache deliberately: `use cache` + `cacheLife` + `cacheTag`, and invalidate with `updateTag`/`revalidateTag`/`revalidatePath` after writes.
- Use `loading.tsx` / `<Suspense>` for slow data instead of blocking the whole page.
- Generate `generateStaticParams` for dynamic routes you want prerendered.

**UI**

- `<Link>` for internal navigation, `<Image>` for images, `next/font` for fonts, `<Form>` for GET forms.
- Custom `error.tsx`, `not-found.tsx`, `global-error.tsx` — every route should have them.

**Config**

- `reactStrictMode: true` in dev.
- `output: 'standalone'` for container deployments.
- Keep `NEXT_PUBLIC_*` free of secrets.

## Security

- **Server Actions and Route Handlers are public HTTP endpoints.** Authenticate and authorize inside every one of them; never rely on the UI.
- Keep secrets server-side; only serializable data crosses the client boundary.
- Use a **DAL** (data access layer) so authorization logic lives in one place, not scattered in components.
- Validate all input (form data, params, search params) before using it.
- Set `Content-Security-Policy` and other security headers in `next.config.ts` or Proxy.
- Beware of untrusted content rendered as HTML (XSS) — sanitize.

## Authentication

- Use a dedicated library (Auth.js, Clerk, Better Auth, …) rather than hand-rolling sessions.
- Sessions live in **cookies** (`httpOnly`, `secure`, `sameSite`).
- Proxy may do **optimistic checks** (redirect if no session cookie) — the real authorization must happen in the data layer.
- Read the session in Server Components / Route Handlers with `await cookies()`.

## Debugging

- `next dev` has a built-in error overlay; DevTools shows the Server/Client tree.
- Check the build output for bundle size per route.
- `next build` surfaces type errors, prerender failures and route classification (static vs dynamic).
- Use `instrumentation.ts` for tracing.

## Documentation for AI agents (Next.js 16.2+)

- Next.js ships **version-matched docs inside the package** at `node_modules/next/dist/docs/` — read those instead of guessing API versions.
- Next.js 16.3+ writes **managed instructions** into the project's `AGENTS.md` (only the block between the agent-rule markers); `next dev` updates them for existing projects when it detects an agent. Configure with the `agentRules` config option.
- Next.js 16.1 and earlier: the legacy `agents-md` command downloads a version-matched copy to `.next-docs/`.
- Docs are also available over the network as Markdown: every page has a `.md` URL, plus `/docs/llms.txt` and `/docs/llms-full.txt` (llms.txt convention).
- `next upgrade --agent` gathers the migration guides and hands the task to an agent.

<!--
Source references:
- https://nextjs.org/docs/app/guides/production-checklist
- https://nextjs.org/docs/app/guides/data-security
- https://nextjs.org/docs/app/guides/authentication
- https://nextjs.org/docs/app/guides/debugging
- https://nextjs.org/docs/app/guides/ai-agents
-->
