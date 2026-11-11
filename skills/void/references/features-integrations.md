---
name: features-integrations
description: Void integrations - meta frameworks (TanStack Start, React Router, SvelteKit, Nuxt, Astro, Analog), Hono, Cloudflare, Node/Bun/Deno targets, and coding agent setup.
---

# Integrations

## Meta frameworks

Keep your framework's routing and rendering; let Void provide databases, storage, jobs and deployment.

Add `voidPlugin()` to the framework's Vite config — it detects resource usage, generates database types, manages migrations and prepares the app for `void deploy`.

| Framework | Package |
|---|---|
| TanStack Start | uses the Cloudflare Vite plugin provided by Void |
| React Router | uses the Cloudflare Vite plugin provided by Void |
| SvelteKit | its own Cloudflare adapter |
| Nuxt | its own Cloudflare adapter |
| Astro | its own Cloudflare adapter |
| Analog | its own Cloudflare adapter |

The setup differs, but your framework keeps handling routing and rendering.

## Hono

Void's routing is built on **Hono** — `defineHandler` wraps a Hono handler, and `middleware/` follows the Hono middleware model. `docs/integrations/hono.md` covers the details, including using Hono directly.

## Cloudflare

`docs/integrations/cloudflare.md` covers the Cloudflare runtime bindings, configuration, token permissions and features with additional (paid) requirements.

## Node.js / Bun / Deno

`docs/integrations/nodejs-bun-deno.md` — Void can also target Node, Bun and Deno instead of Cloudflare Workers.

## Coding agents

`void init` sets up coding agents as part of project initialization:

- New projects get a **minimal `AGENTS.md`** explaining Void and where to read its docs.
- In an existing project, Void **asks before** creating, appending to or updating `AGENTS.md`, and preserves your instructions outside the Void section. Declining leaves the file unchanged; CI and non-interactive runs skip changes to existing projects' instructions.
- Void also links **bundled skills** for detected coding agents.

### Void's own skill

Void ships a skill at `packages/void/skills/void` (published with the `void` package). It is a **task router**: it maps user intent to the right bundled guide and tells the agent to prefer the app's installed documentation at `node_modules/void/docs/` so the docs match the app's Void version.

```sh
npx skills add voidzero-dev/void --skill void
```

<!--
Source references:
- https://void.cloud/integrations/frameworks/overview
- https://void.cloud/integrations/hono
- https://void.cloud/integrations/cloudflare
- https://void.cloud/integrations/nodejs-bun-deno
- https://void.cloud/integrations/agents
-->
