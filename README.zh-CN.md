# jhongxu 的 Skills

一系列 [Agent Skills](https://agentskills.io/home)，既包含我个人的偏好、经验与最佳实践，也包含相关工具的使用文档。

> [!IMPORTANT]
> 手写的 skill 体现的是我的个人品味；生成的 skill 则遵循其所基于的上游文档。欢迎 Fork 并改成你自己的版本。

## 安装

本仓库主要用于托管这些 skills。使用 [skills](https://github.com/vercel-labs/skills) CLI 安装：

```bash
pnpx skills add jhongxu/skills --skill='*'
```

或者全局安装全部 skills：

```bash
pnpx skills add jhongxu/skills --skill='*' -g
```

本地开发时，你也可以直接把某个 skill 软链到 agent 的 skills 目录：

```bash
ln -s "$PWD/skills/jhongxu" ~/.agents/skills/jhongxu
```

## Skills

本仓库收录了来自不同来源、不同定位的 skills。

### 手工维护的 Skills

> 强主观倾向

由我手动维护，融入了我偏好的工具、配置约定与最佳实践。

| Skill | 说明 |
|-------|-------------|
| [jhongxu](skills/jhongxu) | 我在应用/库项目中的偏好与最佳实践（eslint、pnpm、vitest、vue 等） |
| [jhongxu-create-pr](skills/jhongxu-create-pr) | 提交可评审的 PR：Conventional Commits 标题、以证据为基础的正文、通过 `gh --attach` 附上改动前后截图（改编自 [moeru-ai/airi](https://github.com/moeru-ai/airi/blob/main/.agents/skills/create-pr/SKILL.md)） |
| [jhongxu-issue-triage](skills/jhongxu-issue-triage) | 分流当前仓库的 issue 与 PR：找出已修复、重复与灌水条目，建议标签，评估诉求热度，并在执行前确认行动清单 |
| [jhongxu-query](skills/jhongxu-query) | 通过 agent 的提问工具，就某个方案或决策分轮次采访用户，直到达成共识（改编自 [mattpocock/skills](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md)） |
| [jhongxu-simplify](skills/jhongxu-simplify) | 用消融分析精简当前 PR 或改动：只保留被证明必要的部分，做到抽象恰到好处、代码最小、健壮且通用 |

### 由官方文档生成的 Skills

> 不带主观倾向，但有所侧重（例如 TypeScript、ESM、Composition API 等现代技术栈）

基于官方文档生成，再由我微调。

| Skill | 说明 | 来源 |
|-------|-------------|--------|
| [vue](skills/vue) | Vue.js 核心 - 响应式、组件、组合式 API | [vuejs/docs](https://github.com/vuejs/docs) |
| [nuxt](skills/nuxt) | Nuxt 框架 - 文件式路由、服务端路由、模块 | [nuxt/nuxt](https://github.com/nuxt/nuxt) |
| [pinia](skills/pinia) | Pinia - 直观、类型安全的 Vue 状态管理 | [vuejs/pinia](https://github.com/vuejs/pinia) |
| [vite](skills/vite) | Vite 构建工具 - 配置、插件、SSR、库模式 | [vitejs/vite](https://github.com/vitejs/vite) |
| [vitepress](skills/vitepress) | VitePress - 基于 Vite 的静态站点生成器 | [vuejs/vitepress](https://github.com/vuejs/vitepress) |
| [vitest](skills/vitest) | Vitest - 由 Vite 驱动的单元测试框架 | [vitest-dev/vitest](https://github.com/vitest-dev/vitest) |
| [unocss](skills/unocss) | UnoCSS - 原子化 CSS 引擎、预设、转换器 | [unocss/unocss](https://github.com/unocss/unocss) |
| [pnpm](skills/pnpm) | pnpm - 快速、节省磁盘空间的包管理器 | [pnpm/pnpm.io](https://github.com/pnpm/pnpm.io) |
| [nitro](skills/nitro) | Nitro - Nuxt 的服务端引擎、部署预设、运行时配置 | [nitrojs/nitro](https://github.com/nitrojs/nitro) |
| [react](skills/react) | React 19 - 函数组件、Hooks、state/effects、Transitions、Server Components、React Compiler | [reactjs/react.dev](https://github.com/reactjs/react.dev) |
| [next](skills/next) | Next.js 16 App Router - 路由、Server/Client Components、Server Actions、Cache Components、Route Handlers | [vercel/next.js](https://github.com/vercel/next.js) |
| [hono](skills/hono) | Hono - Web 标准路由、中间件、校验器、类型化 RPC、JSX/SSR、流式响应、多运行时部署 | [honojs/website](https://github.com/honojs/website) |
| [jotai](skills/jotai) | Jotai v3 - React 原子化状态：atom、派生 atom、配合 Suspense 的异步 atom、Provider/store、工具与扩展 | [pmndrs/jotai](https://github.com/pmndrs/jotai) |
| [tanstack-router](skills/tanstack-router) | TanStack Router v1 - 类型安全的文件式路由、带 SWR 缓存的 loader、类型化搜索参数、延迟加载、代码分割、TanStack Start | [TanStack/router](https://github.com/TanStack/router) |
| [tanstack-query](skills/tanstack-query) | TanStack Query v5 - 服务端状态：缓存、失效、变更、乐观更新、无限查询、Suspense、SSR 注水 | [TanStack/query](https://github.com/TanStack/query) |
| [tanstack-form](skills/tanstack-form) | TanStack Form v1 - 无头、类型优先的表单：字段校验、Standard Schema、表单分组、数组字段、可复用字段组件 | [TanStack/form](https://github.com/TanStack/form) |
| [zod](skills/zod) | Zod v4 - TypeScript 优先的 schema 校验：原始类型、联合类型、精炼、错误定制、编解码器、JSON Schema | [colinhacks/zod](https://github.com/colinhacks/zod) |
| [void](skills/void) | Void - 由 Vite 驱动的 Cloudflare Workers 全栈框架：API 路由、Pages 模式、Drizzle、类型化 fetch、CLI 与部署 | [voidzero-dev/void](https://github.com/voidzero-dev/void) |
| [drizzle](skills/drizzle) | Drizzle ORM - 面向 Postgres/MySQL/SQLite 的无头 TypeScript ORM：schema 定义、查询构建器、关系、Drizzle Kit 迁移、Zod 校验器 | [drizzle-team/drizzle-orm](https://github.com/drizzle-team/drizzle-orm) |

## 常见问题

### 这个合集有什么不同？

关键区别在于：它会把源文档克隆到本地（放入 git 忽略的 `sources/`），并直接据此生成 skills。这能提供更可靠的上下文，也让 skills 随上游变化持续保持更新。

### Skills vs llms.txt vs AGENTS.md

skills 的价值在于**可分享**与**按需加载**。

可分享意味着提示词更容易管理、也更容易在项目间复用。按需加载意味着 skill 只在被需要时才被拉取进来，其规模远超任何 agent 上下文窗口一次所能容纳的内容。

AGENTS.md 会一次性载入全部内容，因此 agent 总会遵守它；而 skills 则可能出现「漏拉取」的情况——本该用的时候 agent 并没有加载。如果你希望某些 skills 始终生效，可以直接在 AGENTS.md 中引用它们。

## 新增一个项目

1. 在 [meta.ts](meta.ts) 的 `sources` 对象中添加该仓库
2. 安装依赖：`pnpm install`
3. 运行 `pnpm start cleanup`，移除已不再列出的 sources 与 skills
4. 运行 `pnpm start init`，克隆 sources
5. 运行 `pnpm start sync`，拉取最新的源文档
6. 让你的 agent 执行 `Generate skills for <project>`（建议一次一个，以便控制 token 消耗）

详细的生成指南见 [AGENTS.md](AGENTS.md)。

## 致谢

本仓库的工作流、结构与工具链源自 [antfu/skills](https://github.com/antfu/skills)，由我按自己的偏好改编并维护。

本仓库经过 Fork 并以单一 root commit 重写，因此上游历史已不再包含在内。上面的致谢是刻意保留的：原作仍归其作者所有，而本合集按 [LICENSE.md](LICENSE.md) 所述采用 MIT 许可证。

## 许可

本仓库中的 skills 与脚本采用 [MIT](LICENSE.md) 许可证。
