---
name: react-skills
description: React 栈 Agent Skills 集合（Next.js / TanStack / StyleX / antd v6 / tRPC）
---

# React 栈 Agent Skills 集合

本仓库为 React 技术栈定制，按需加载。

## 加载方式

- 全量加载：`*`
- 挑选加载：`nextjs,tanstack,data-and-forms,testing`
- 在项目 `AGENTS.md` / `CLAUDE.md` 引用 skill 名称，agent 启动时自动加载

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
