# React 栈 Agent Skills

为 React 技术栈定制的 [Agent Skills](https://agentskills.io/home) 集合。

> 本仓库是 [antfu/skills](https://github.com/antfu/skills) 的 fork，已改造为 React 栈版本，长期独立维护。

## 技术栈覆盖

- **框架**：Next.js（App Router）、TanStack Router
- **样式 / UI**：StyleX、Ant Design v6、UnoCSS
- **状态 / 数据**：TanStack Query、Zustand、tRPC、zod、MSW
- **测试**：Vitest、Playwright、Storybook
- **底座**：pnpm、tsdown、antfu eslint config

## 安装

```bash
# 当前项目
pnpx skills add jhongxu/skills --skill='*'

# 全局
pnpx skills add jhongxu/skills --skill='*' -g
```

挑选加载：

```bash
pnpx skills add jhongxu/skills --skill='nextjs,tanstack,data-and-forms,testing'
```

## Skill 列表

### 手写 Skills

| Skill | 说明 |
|-------|------|
| [foundation](skills/foundation) | pnpm / tsdown / vitest / eslint / unocss |
| [react](skills/react) | React 核心 API 与模式 |
| [nextjs](skills/nextjs) | Next.js App Router / RSC / Server Actions |
| [tanstack](skills/tanstack) | TanStack Router / Query / Form |
| [ui](skills/ui) | StyleX / antd v6 / UnoCSS |
| [data-and-forms](skills/data-and-forms) | tRPC / zod / zustand / msw / react-hook-form |
| [testing](skills/testing) | Vitest / Playwright / Storybook |
| [preferences](skills/preferences) | 个人项目结构 / 命名 / 提交规范 |

### 同步自 [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)

| Skill | 说明 |
|-------|------|
| react-best-practices | React 最佳实践（Vercel 维护） |
| composition-patterns | 组件组合模式 |
| web-design-guidelines | Web 设计规范 |

## 维护

```bash
pnpm install
pnpm start check    # 查看 vendor 是否有上游更新
pnpm start sync     # 拉取并更新 vendor skill
pnpm start lint     # 校验所有 SKILL.md frontmatter
pnpm start cleanup  # 清理 orphan skill
```

新增手写 skill 见 [AGENTS.md](AGENTS.md)。

## License

MIT（见 [LICENSE.md](LICENSE.md)）。
