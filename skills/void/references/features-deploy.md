---
name: features-deploy
description: Void CLI and deployment - init, dev, deploy, connect, secrets, domains, sandboxes, remote development and the Void Platform.
---

# CLI & Deployment

`void` is a local binary from the installed `void` package. Before running a command, find its group in `docs/reference/cli.md` and read the matching page under `docs/reference/cli/`.

## Common commands

| Command | Purpose |
|---|---|
| `void init` | scaffold a new app (framework, starter, deployment target) |
| `void dev` | run the dev server (Vite+ default: `vpr dev`) |
| `void build` | build the app |
| `void deploy` | build, provision resources, apply migrations, deploy |
| `void connect <url>` | connect the project to a Void Platform |
| `void generate` | generate types/resources |
| `void migrate` | apply database migrations |
| `void secret put` | set a production secret |
| `void info` | inspect resources, names, instance keys |
| `void project …` | status, deployment history, logs, cache purge |
| `void auth …` | login / logout / whoami |
| `void database …` | status, reset, seed, export |
| `void domains …` | custom domain setup |
| `void platform …` | platform administration |
| `void email …` | email configuration |

## Deploying to your own Cloudflare account

```sh
void connect --platform cloudflare
void deploy --platform cloudflare
```

Void opens a browser to sign in and pick the account; later deploys use the saved target, so plain `void deploy` works.

- Native apps work on **Workers Free** within its quotas.
- **Sandboxes** require Workers Paid and Containers access.
- `void deploy --skip-migrations` skips application and authentication SQL for that invocation — use it when migrations run separately.

## Deploying to a Void Platform

```sh
void connect https://platform.example.com   # explicit scheme
void connect localhost:8787                  # loopback defaults to HTTP
void deploy
```

- Platform hostnames default to **HTTPS**; loopback hosts (`localhost`, `127.0.0.1`, `[::1]`) default to **HTTP**. An explicit scheme always wins.
- For a one-off deployment elsewhere: connect to that platform, set `VOID_API_URL` for the deploy command and pass `--project <slug>` — this preserves the app's saved destination, including when the target project is new.
- Use `--plan` to review platform changes before applying them.
- Use `void platform list` to find the installation slug for maintenance; for recovery, follow the documented resume/repair workflow and preserve the installation's credentials and resources.

## Secrets & environment

Local values in `.env`; production secrets with `void secret put`. Declare the keys in `env.ts` and read them via `env` from `void/env`.

## Sandboxes & remote dev

`docs/guide/sandboxes.md` and `docs/guide/remote-dev.md` cover isolated execution environments and developing against a remote deployment.

<!--
Source references:
- https://void.cloud/reference/cli
- https://void.cloud/guide/deployment
- https://void.cloud/guide/env-vars
- https://void.cloud/guide/sandboxes
- https://void.cloud/guide/remote-dev
- https://void.cloud/guide/self-hosted-platform
-->
