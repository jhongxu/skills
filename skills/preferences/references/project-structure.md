# Project Structure

> 个人工程偏好——新项目从这些约定起步。参考 antfu 风格：扁平优先、colocation、kebab-case 文件名、按功能聚合而非按类型分散。目标是让 AI 和人都能快速定位代码。

## 1. 单包应用（SPA / Next.js）

```
src/
├── app/                    # Next.js App Router 路由（或 pages/ 旧版）
├── components/             # 跨页面共享组件
│   └── user-card/          # 多文件组件目录（kebab-case）
│       ├── index.ts        #   入口，重导出
│       ├── user-card.tsx   #   组件实现
│       ├── user-card.test.tsx
│       └── user-card.stories.tsx
├── features/               # 按业务功能聚合（自包含）
│   └── auth/
│       ├── components/
│       ├── hooks/
│       ├── api.ts          # 该功能的 tRPC/router
│       └── types.ts
├── hooks/                  # 跨功能共享 hooks
├── lib/                    # 工具函数、第三方封装（无 UI）
│   ├── trpc.ts
│   └── utils.ts
├── types/                  # 全局类型定义
│   └── index.d.ts
└── styles/                 # 全局样式、主题
```

### 原则

- **按功能聚合 > 按类型分散**：`features/auth/` 里放该功能所有代码（组件、hooks、API、类型），不是 `components/auth/` + `hooks/auth/` + `api/auth/` 分散四处。功能内聚后删改一个功能只动一个目录。
- **扁平优先**：目录层级不超过 4 层。深嵌套说明你在按类型而非功能组织。
- **多文件组件用目录**：组件超过 1 个文件（test + story + 子组件）时建目录，`index.ts` 当入口。单文件组件直接 `button.tsx`。
- **colocation**：测试和 story 紧邻源码（`button.test.tsx`、`button.stories.tsx`），不是单独 `__tests__/` 目录。改组件时一眼看到测试。

### 路径别名

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

```ts
import { Button } from '@/components/button'      // ✅ 别名
import { Button } from '../../../components/button' // ❌ 相对路径深嵌套
```

> Vite 配 `resolve.alias`、Next.js 自动读 `tsconfig.json` paths。eslint 用 `antfu` 的 `import/no-relative-parent-imports` 规则强制。见 [../foundation/references/eslint-antfu.md](../foundation/references/eslint-antfu.md)。

## 2. Monorepo（pnpm workspace）

```
.
├── pnpm-workspace.yaml      # 声明 packages/*
├── package.json             # 根：scripts、devDeps
├── tsconfig.json            # 基础配置，各包 extends
├── packages/
│   ├── ui/                  # 组件库
│   │   ├── src/
│   │   ├── package.json     # name: "@my/ui"
│   │   └── tsconfig.json
│   ├── api/                 # 后端 / tRPC
│   └── web/                 # 前端应用
└── apps/                    # 部署单元（区别于 packages：可独立部署）
    └── docs/
```

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### Catalogs（统一依赖版本）

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
catalogs:
  react: 19.2.0
  next: 16.0.0
  zod: ^4.3.0
```

```jsonc
// packages/web/package.json
{
  "dependencies": {
    "react": "catalog:",
    "zod": "catalog:"
  }
}
```

> 所有包共用同一版本，升级只改 `pnpm-workspace.yaml` 一处。见 [../foundation/references/pnpm.md](../foundation/references/pnpm.md)。

## 3. 本 Skills 仓库结构

```
.
├── meta.ts                  # 单一配置源：manual + vendors
├── scripts/cli.ts           # pnpm start {sync,check,lint,cleanup}
├── AGENTS.md                # 仓库规则（AI 必读）
├── docs/                    # spec / plan 归档
└── skills/
    ├── SKILL.md             # 顶层索引
    ├── {name}/              # 单一 skill
    │   ├── SKILL.md         # 该 skill 索引（frontmatter + references 表）
    │   └── references/      # 一篇一个概念，category-concept.md
    └── ...
```

> 见 [AGENTS.md](../../AGENTS.md)：每个 reference 一个概念、实战优先、跨 skill 用相对路径引用。

## 4. 测试文件位置

```
# colocation（推荐）
button.tsx
button.test.tsx
button.stories.tsx

# 同目录 test/ 子目录（测试多时）
user-profile/
├── index.ts
├── user-profile.tsx
└── __tests__/
    ├── validation.test.ts
    └── rendering.test.ts
```

- 默认 colocation（`.test.tsx` 紧邻源码）。
- 测试文件多了（>3）才考虑 `__tests__/` 子目录，仍在组件目录内。
- E2E 测试独立 `e2e/` 或 `tests/e2e/` 目录（不在 src 里）。

## 5. 配置文件

```
.
├── vite.config.ts           # Vite + Vitest 配置合一
├── eslint.config.ts         # Flat config（antfu）
├── tsconfig.json
├── uno.config.ts            # UnoCSS
├── .storybook/
│   ├── main.ts
│   └── preview.ts
└── playwright.config.ts
```

> 配置文件在根目录扁平放置，不进 `config/` 子目录（除 `.storybook/` 这类工具约定的）。eslint 用 Flat config（`eslint.config.ts`，非 `.eslintrc`），见 [../foundation/references/eslint-antfu.md](../foundation/references/eslint-antfu.md)。

## 6. 坑

| 坑 | 说明 |
|----|------|
| 按类型分目录（`components/` + `hooks/` + `utils/` 平铺） | 功能分散难追踪；改按 `features/` 聚合 |
| 组件单文件膨胀到 500 行 | 拆多文件目录，子组件 + hooks + types 分文件 |
| 相对路径 `../../../` | 用 `@/` 别名；antfu eslint 强制 `no-relative-parent-imports` |
| 配置散落 `config/` 目录 | 扁平放根目录，工具自动发现 |
| monorepo 版本不一致 | 用 pnpm catalogs 统一 |
| 测试独立 `tests/` 目录 | colocation：测试紧邻源码 |
| `index.ts` 重导出过多 | 只重导公开 API；内部实现不导出 |
| 目录层级过深（>4 层） | 扁平化；深嵌套说明按类型而非功能组织 |
