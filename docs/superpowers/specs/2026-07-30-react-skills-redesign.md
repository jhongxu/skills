# React 栈 Agent Skills 仓库重构 Spec

**Date:** 2026-07-30
**Status:** Draft (待用户审阅)
**Owner:** jianghongxu

---

## 1. 背景

当前仓库 fork 自 [antfu/skills](https://github.com/antfu/skills)，所有内容围绕 Vue 生态（vue/nuxt/pinia/vueuse/slidev 等）。用户主力技术栈为 React + Next.js + TanStack + StyleX + antd v6，Vue 生态内容**全部作废**。

**核心目标**：将本仓库改造为「React 栈的 Agent Skills 集合」，长期独立维护，**不再与 antfu/skills 上游同步**。

---

## 2. 目标态仓库结构

```
.   （仓库根）
├── README.md                   # 重写：React 栈 skills 集合介绍
├── AGENTS.md                   # 重写：React 栈 skill 编写约定
├── LICENSE.md                  # 保留
├── docs/                       # 新建：spec/plan 归档
├── package.json                # 保留最小化
├── pnpm-lock.yaml              # 保留
├── tsconfig.json               # 保留
├── eslint.config.js            # 保留
├── meta.ts                     # 改造：移除 submodules/vendors，仅保留 manual
├── scripts/
│   └── cli.ts                  # 改造：移除 init/sync，保留 check/cleanup，新增 lint 子命令
└── skills/
    ├── SKILL.md                # 顶层：所有 skill 索引与使用说明
    │
    ├── foundation/             # 手写：工程化底座（与框架无关）
    │   ├── SKILL.md
    │   └── references/
    │       ├── pnpm.md
    │       ├── tsdown.md
    │       ├── vitest.md
    │       ├── eslint-antfu.md
    │       └── unocss.md
    │
    ├── react/                  # 手写：React 核心 API 与模式
    │   ├── SKILL.md
    │   └── references/
    │       ├── core-hooks.md
    │       ├── component-patterns.md
    │       ├── server-components.md
    │       └── concurrent-features.md
    │
    ├── nextjs/                 # 手写：Next.js（App Router 优先）
    │   ├── SKILL.md
    │   └── references/
    │       ├── app-router.md
    │       ├── data-fetching.md
    │       ├── server-actions.md
    │       └── rsc-patterns.md
    │
    ├── tanstack/               # 手写：TanStack Router / Query / Form
    │   ├── SKILL.md
    │   └── references/
    │       ├── router.md
    │       ├── query.md
    │       └── form.md
    │
    ├── ui/                     # 手写：StyleX + antd v6 + UnoCSS
    │   ├── SKILL.md
    │   └── references/
    │       ├── stylex.md
    │       ├── antd-v6.md
    │       └── icon-and-theming.md
    │
    ├── data-and-forms/         # 手写：tRPC + zod + zustand + msw + rhf
    │   ├── SKILL.md
    │   └── references/
    │       ├── trpc.md
    │       ├── zod.md
    │       ├── zustand.md
    │       ├── react-hook-form.md
    │       └── msw.md
    │
    ├── testing/                # 手写：Vitest + Playwright + Storybook
    │   ├── SKILL.md
    │   └── references/
    │       ├── vitest-react.md
    │       ├── playwright.md
    │       └── storybook.md
    │
    ├── preferences/            # 手写：用户个人偏好（参考原 antfu skill）
    │   ├── SKILL.md
    │   └── references/
    │       ├── project-structure.md
    │       ├── naming.md
    │       └── commit-and-pr.md
    │
    ├── react-best-practices/   # 同步自 vercel-labs/agent-skills
    │   ├── SKILL.md            # 来自上游
    │   ├── AGENTS.md           # 来自上游
    │   ├── rules/              # 来自上游
    │   ├── README.md           # 来自上游
    │   ├── metadata.json       # 来自上游
    │   └── SYNC.md             # 写入：含上游 SHA
    │
    ├── composition-patterns/   # 同步自 vercel-labs/agent-skills
    │   ├── ...                 # 来自上游
    │   └── SYNC.md
    │
    └── web-design-guidelines/  # 同步自 vercel-labs/agent-skills
        ├── ...                 # 来自上游
        └── SYNC.md
```

**未引入的 vendor skill（决策）**：
- `react-native-skills` — 暂不引入（用户当前无 React Native 需求）
- `deploy-to-vercel` — 暂不引入（部署相关，与 skills 知识库主题偏离）

---

## 3. 变更清单

### 3.1 删除（Vue 专属）

**`sources/` 全部 `git rm`**（Vue 文档源）：
- `sources/vue/` (vuejs/docs)
- `sources/nuxt/` (nuxt/nuxt)
- `sources/pinia/` (vuejs/pinia)
- `sources/pnpm/` (pnpm/pnpm.io)
- `sources/unocss/` (unocss/unocss)
- `sources/vite/` (vitejs/vite)
- `sources/vitepress/` (vuejs/vitepress)
- `sources/vitest/` (vitest-dev/vitest)
- `sources/nitro/` (nitrojs/nitro)

**`vendor/` 5 个 `git rm`**（Vue 专属上游 skill 同步源）：
- `vendor/slidev/`
- `vendor/tsdown/`
- `vendor/turborepo/`
- `vendor/vuejs-ai/`
- `vendor/vueuse/`
- 保留 `vendor/web-design-guidelines/`（**唯一 React vendor**，详见 3.5）

**`skills/` 下 17 个 Vue 生态 skill 目录** `rm -rf`：
- `skills/vue/`
- `skills/nuxt/`
- `skills/pinia/`
- `skills/pnpm/`
- `skills/unocss/`
- `skills/vite/`
- `skills/vitepress/`
- `skills/vitest/`
- `skills/nitro/`
- `skills/slidev/`
- `skills/tsdown/`
- `skills/turborepo/`
- `skills/vueuse-functions/`
- `skills/vue-best-practices/`
- `skills/vue-router-best-practices/`
- `skills/vue-testing-best-practices/`
- `skills/web-design-guidelines/` ← **会被 `pnpm start sync` 重新生成**（详见 3.5）

**`instructions/` 9 个 Vue 专属指引** `rm`：
- `instructions/vue.md`
- `instructions/nuxt.md`
- `instructions/pinia.md`
- `instructions/pnpm.md`
- `instructions/unocss.md`
- `instructions/vite.md`
- `instructions/vitepress.md`
- `instructions/vitest.md`
- `instructions/tsdown.md`

**根目录文件**：
- `.gitmodules` ← 用 `git rm` 移除 `sources/` 与 5 个 `vendor/` 后，文件会被 git 自动重写为只剩 `vendor/web-design-guidelines` 一条
- `pnpm-workspace.yaml` `rm`（无 workspace）

### 3.2 改造（保留并修改）

**`meta.ts`** —— 删除 `submodules` 字段；`vendors` 字段替换为：

```ts
export const vendors: Record<string, VendorSkillMeta> = {
  'web-design-guidelines': {
    source: 'https://github.com/vercel-labs/agent-skills',
    skills: {
      'react-best-practices': 'react-best-practices',
      'composition-patterns': 'composition-patterns',
      'web-design-guidelines': 'web-design-guidelines',
    },
  },
}
```

`manual` 数组替换为手写 skill 列表：
```ts
export const manual = [
  'foundation',
  'react',
  'nextjs',
  'tanstack',
  'ui',
  'data-and-forms',
  'testing',
  'preferences',
]
```

**`scripts/cli.ts`** —— 改动：
- 移除 `initSubmodules()`（submodule 不再使用）
- 移除 `syncSubmodules()` 中的 sources 遍历（仅保留 vendor 同步）
- 新增 `lintSkills()` 子命令：校验所有 `skills/{name}/SKILL.md` 存在、frontmatter 合法
- 保留 `checkUpdates()`（用于检测 vercel-labs/agent-skills 是否有更新）
- 保留 `cleanup()`（仍可清理 orphan skills）

**`README.md`** —— 全文重写：
- 移除 antfu 引用
- 标题改为「React 栈 Agent Skills 集合」
- 列出 8 个手写 skill + 3 个 vendor-synced skill
- 新增「Usage」一节：`pnpx skills add jhongxu/skills --skill='*'`
- 新增「Maintenance」一节：纯手写流程，不跑 sync

**`AGENTS.md`** —— 全文重写为 React 栈的 skill 编写约定（见第 5 节）

**`package.json`** —— 保留，但移除 `simple-git-hooks` / `lint-staged`（如不需要 pre-commit）；保留 `pnpm start` 入口

### 3.3 新增

**`docs/superpowers/specs/`** —— 本 spec 文件及未来 spec 归档目录

**`skills/SKILL.md`** —— 顶层 skill 索引（agent 加载本仓库时第一入口）

**8 个手写 skill 目录**（含 `SKILL.md` + `references/` 骨架）—— 见 2.1

### 3.4 `pnpm start sync` 行为（新）

执行后只做一件事：同步 `meta.ts` 中 `vendors` 声明的 3 个 React skill：

```
vendor/web-design-guidelines/skills/{react-best-practices,composition-patterns,web-design-guidelines}/
  →  skills/{同名}/   （带 SYNC.md 写 SHA）
```

### 3.5 关于 `web-design-guidelines` 的取舍

`vercel-labs/agent-skills` 中 React 相关 skill 共 3 个，全部纳入 vendor 同步：
- `react-best-practices`（AGENTS.md 88.7KB，质量高）
- `composition-patterns`（与 foundation 概念互补）
- `web-design-guidelines`（设计规范）

不引入的：
- `react-native-skills`（移动端，本仓库定位 web 栈）
- `deploy-to-vercel`（部署流程，与 skills 知识库定位偏离）

---

## 4. 顶层 `skills/SKILL.md` 模板

```markdown
---
name: react-skills
description: React 栈 Agent Skills 集合（Next.js / TanStack / StyleX / antd v6 / tRPC）
---

# React 栈 Agent Skills 集合

本仓库为 React 技术栈定制，按需加载。

## 加载方式

- 在项目 `AGENTS.md` / `CLAUDE.md` 引用：列出你需要的 skill 名称
- 全量加载：`*`
- 挑选加载：`nextjs,tanstack,data-and-forms,testing`

## Skill 索引

### 手写 Skills

| Skill | 说明 | 适用场景 |
|-------|------|----------|
| foundation | pnpm / tsdown / vitest / eslint / unocss 底座 | 任何 React 项目 |
| react | React 核心 API 与模式 | 任何 React 项目 |
| nextjs | Next.js App Router / RSC / Server Actions | Next.js 项目 |
| tanstack | TanStack Router / Query / Form | 路由 + 服务端状态 |
| ui | StyleX / antd v6 / UnoCSS | 组件与样式 |
| data-and-forms | tRPC / zod / zustand / msw / react-hook-form | 数据层与表单 |
| testing | Vitest / Playwright / Storybook | 测试 |
| preferences | 个人项目结构 / 命名 / 提交规范 | 个人风格统一 |

### 同步 Skills（来自 vercel-labs/agent-skills）

| Skill | 说明 |
|-------|------|
| react-best-practices | React 最佳实践（Vercel 维护） |
| composition-patterns | 组件组合模式 |
| web-design-guidelines | Web 设计规范 |
```

---

## 5. 新 `AGENTS.md` 编写约定（核心条款）

1. **每个 reference 一篇一个概念**，文件名 `category-concept.md`。
2. **实战优先**：能跑代码就贴代码，不抄文档。
3. **跨 skill 引用**：用相对路径，例如 `[zod.md](../data-and-forms/references/zod.md)`。
4. **第三方 API 必须用 Context7 查最新文档**（Ant Design v6、tRPC、StyleX、TanStack Form 等版本敏感），不依赖训练数据。
5. **不写 placeholder / TBD**：不确定的内容先不写。
6. **不修改 vendor-synced 的 skill 内容**——修改需贡献给上游 `vercel-labs/agent-skills`。
7. **新增手写 skill 必须更新 `meta.ts` 的 `manual` 数组**。
8. **删除 skill 必须跑 `pnpm start cleanup`**，保持 `meta.ts` 与 `skills/` 一致。

---

## 6. 范围与限制

### 本 spec 覆盖

- 仓库结构调整（删除/改造/新增）
- meta.ts / scripts/cli.ts / README / AGENTS.md 改写约定
- 顶层 `skills/SKILL.md` 与各手写 skill 的 `SKILL.md` 骨架（**不含 reference 文件实际内容**）
- vendor 同步配置

### 本 spec 不覆盖

- 任何 `references/*.md` 的实际内容（**下一轮按 skill 逐个深写**）
- 实际 `pnpx skills` 安装的端到端验证
- CI / pre-commit 改造

---

## 7. 执行顺序

1. 删除 `sources/`、`vendor/`（submodule 目录）
2. `rm -rf` Vue 专属的 `skills/` 子目录（18 个）
3. `rm` `instructions/`（9 个文件）、`pnpm-workspace.yaml`、`.gitmodules`
4. 编辑 `meta.ts`（清空 submodules，替换 vendors，替换 manual）
5. 编辑 `scripts/cli.ts`（移除 init、简化 sync、新增 lint）
6. 确认 `vendor/web-design-guidelines` 仍在（已 init，无需 `submodule add`）；运行 `git submodule update` 拉最新
7. 写顶层 `skills/SKILL.md`
8. 写 8 个手写 skill 的 `SKILL.md` 骨架
9. 重写 `README.md`、`AGENTS.md`
10. 执行 `pnpm start sync` 拉取 3 个 React vendor skill
11. 跑 `pnpm start cleanup` 确认无 orphan
12. 跑 `pnpm start check` 确认 vendor SHA 正确
13. `git add -A && git commit` 一次性提交

---

## 8. 风险与回滚

- **风险 1**：误删 `sources/` 中 submodule 历史。回滚方式：`git reflog` 找回 commit。
- **风险 2**：`meta.ts` 改写后 `pnpm start sync` 行为变更。回滚方式：保留当前 commit，reset 回 fork 状态。
- **风险 3**：vendor/web-design-guidelines 重新添加后 SHA 漂移（与 antfu/skills 上游不同步）。**这是预期行为**——本仓库独立维护。
