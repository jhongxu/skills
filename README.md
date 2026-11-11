# jhongxu's Skills

A collection of [Agent Skills](https://agentskills.io/home) reflecting my own preferences, experience, and best practices, along with usage documentation for the tools.

> [!IMPORTANT]
> The hand-written skills are my personal taste; the generated ones follow the upstream docs they are built from. Fork it and make it yours.

## Installation

This repo mainly hosts the skills. Install them with the [skills](https://github.com/vercel-labs/skills) CLI:

```bash
pnpx skills add jhongxu/skills --skill='*'
```

or to install all of them globally:

```bash
pnpx skills add jhongxu/skills --skill='*' -g
```

During local development you can also symlink a skill straight into your agent's skills directory:

```bash
ln -s "$PWD/skills/jhongxu" ~/.agents/skills/jhongxu
```

## Skills

This repo includes skills from different sources with different scopes.

### Hand-maintained Skills

> Opinionated

Manually maintained by me, with my preferred tools, setup conventions, and best practices.

| Skill | Description |
|-------|-------------|
| [jhongxu](skills/jhongxu) | My preferences and best practices for app/library projects (eslint, pnpm, vitest, vue, etc.) |
| [jhongxu-create-pr](skills/jhongxu-create-pr) | Open reviewable PRs: Conventional Commits title, evidence-based body, before/after screenshots via `gh --attach` (adapted from [moeru-ai/airi](https://github.com/moeru-ai/airi/blob/main/.agents/skills/create-pr/SKILL.md)) |
| [jhongxu-issue-triage](skills/jhongxu-issue-triage) | Triage issues and PRs of the current repo: find fixed, duplicate, and spam items, suggest labels, gauge demand, and confirm an action table before acting |
| [jhongxu-query](skills/jhongxu-query) | Interview the user about a plan or decision in rounds via the agent's question tool until reaching shared understanding (adapted from [mattpocock/skills](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md)) |
| [jhongxu-simplify](skills/jhongxu-simplify) | Simplify the current PR or changes with an ablation study: keep only what is proven needed, with just-right abstraction, minimal, robust, and universal code |

### Skills Generated from Official Documentation

> Unopinionated but with tilted focus (e.g. TypeScript, ESM, Composition API, and other modern stacks)

Generated from official documentation and fine-tuned by me.

| Skill | Description | Source |
|-------|-------------|--------|
| [vue](skills/vue) | Vue.js core - reactivity, components, composition API | [vuejs/docs](https://github.com/vuejs/docs) |
| [nuxt](skills/nuxt) | Nuxt framework - file-based routing, server routes, modules | [nuxt/nuxt](https://github.com/nuxt/nuxt) |
| [pinia](skills/pinia) | Pinia - intuitive, type-safe state management for Vue | [vuejs/pinia](https://github.com/vuejs/pinia) |
| [vite](skills/vite) | Vite build tool - config, plugins, SSR, library mode | [vitejs/vite](https://github.com/vitejs/vite) |
| [vitepress](skills/vitepress) | VitePress - static site generator powered by Vite | [vuejs/vitepress](https://github.com/vuejs/vitepress) |
| [vitest](skills/vitest) | Vitest - unit testing framework powered by Vite | [vitest-dev/vitest](https://github.com/vitest-dev/vitest) |
| [unocss](skills/unocss) | UnoCSS - atomic CSS engine, presets, transformers | [unocss/unocss](https://github.com/unocss/unocss) |
| [pnpm](skills/pnpm) | pnpm - fast, disk space efficient package manager | [pnpm/pnpm.io](https://github.com/pnpm/pnpm.io) |
| [nitro](skills/nitro) | Nitro - server engine for Nuxt, deployment presets, runtime config | [nitrojs/nitro](https://github.com/nitrojs/nitro) |

## FAQ

### What Makes This Collection Different?

The key difference is that it clones the source documentation locally (into the git-ignored `sources/`) and generates skills directly from it. This provides more reliable context and allows the skills to stay up-to-date with upstream changes over time.

### Skills vs llms.txt vs AGENTS.md

The value of skills lies in being **shareable** and **on-demand**.

Being shareable makes prompts easier to manage and reuse across projects. Being on-demand means skills can be pulled in as needed, scaling far beyond what any agent's context window could fit at once.

AGENTS.md loads everything upfront, so agents always respect it, whereas skills can have false negatives where agents don't pull them in when you'd expect. If you want certain skills to always apply, you can reference them directly in your AGENTS.md.

## Adding A New Project

1. Add the repo to the `sources` object in [meta.ts](meta.ts)
2. Install dependencies: `pnpm install`
3. Run `pnpm start cleanup` to remove sources and skills that are no longer listed
4. Run `pnpm start init` to clone the sources
5. Run `pnpm start sync` to pull the latest source docs
6. Ask your agent to `Generate skills for <project>` (recommended one at a time to manage token usage)

See [AGENTS.md](AGENTS.md) for detailed generation guidelines.

## Credits

The workflow, structure, and tooling of this repository originate from [antfu/skills](https://github.com/antfu/skills), adapted to my own preferences and maintained by me.

This repository was forked and rewritten onto a single root commit, so the upstream history is no longer part of it. The attribution above is kept deliberately: the original work stays credited to its authors, and this collection remains MIT licensed, as stated in [LICENSE.md](LICENSE.md).

## License

Skills and the scripts in this repository are [MIT](LICENSE.md) licensed.
