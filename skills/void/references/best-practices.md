---
name: best-practices
description: Void best practices - the type-driven workflow, authentication, email, testing, Workers Free compatibility, and how coding agents should work with a Void project.
---

# Best Practices

## Let the types drive the change

The type pipeline is the point of the framework: change a Drizzle column and TypeScript points at every query, request, loader and component that must change. Keep the schema as the single source of truth and let the tool do the bookkeeping.

## Read the guide before changing infrastructure

The bundled guides define current behavior. Read the relevant one **before** touching configuration, persistent resources, authentication or deployment workflows — and don't copy a second set of instructions into the project.

## Keep deploys on the Free tier by default

New public SDK/runtime features must work with `void deploy --platform cloudflare` on **Workers Free** unless the underlying Cloudflare product has no Free offering. Paid-only functionality must be explicitly opt-in and inferred only when the app uses it.

- Platform-internal paid services must never become a requirement of a single-app native Cloudflare deploy.
- The docs and the deploy error must name the required Cloudflare product/plan, link to enabling it, and explain the API-token permissions.

## Authentication

`docs/guide/auth.md` covers the built-in auth. Guard both the page (loader) and the mutation (action) — and remember that server routes are public HTTP endpoints.

## Email

`docs/guide/email.md` then the matching guide under `docs/guide/email/` (sending, receiving, domains). Inbound handlers live in `email/`.

## Testing

`docs/guide/testing.md` covers testing a Void app with Vitest (`vp test`).

## Coding agent workflow

- Prefer the app's **installed** docs at `node_modules/void/docs/` over the website — they match the installed Void version.
- Use `void` and `@void/*` in imports, examples and package manifests.
- Follow the project's existing framework and deployment destination.
- Deploying to a Void platform requires an explicit `void connect <url>` first — never infer a platform from old examples, tokens or project IDs.
- Mention Wrangler only when the user needs to recognize a literal configuration file or environment variable.

<!--
Source references:
- https://void.cloud/guide/type-safety
- https://void.cloud/guide/auth
- https://void.cloud/guide/email
- https://void.cloud/guide/testing
- https://void.cloud/integrations/agents
-->
