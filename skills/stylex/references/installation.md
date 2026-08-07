# 安装与编译器配置

> 面向 `@stylexjs/stylex@0.19+`。版本敏感，以下来自官方文档核对。样式 API 见 [styling.md](styling.md)；主题配置项见 [theming.md](theming.md)。

## 1. 安装

```bash
pnpm add @stylexjs/stylex
pnpm add -D @stylexjs/babel-plugin @stylexjs/eslint-plugin
```

按打包器再装对应集成：

| 打包器/框架 | 集成包 |
|------------|--------|
| Next.js | `@stylexjs/nextjs-plugin` |
| Vite / Webpack / Rspack / Rollup / Esbuild / Bun | `@stylexjs/unplugin`（v0.17+，统一多打包器） |
| 纯 PostCSS 流水线 | `@stylexjs/postcss-plugin` |
| 无打包器（预生成 CSS） | `@stylexjs/cli` |

> v0.17 起 `unplugin` 是推荐方式，覆盖 Vite/Webpack/Rspack/Rollup 等多打包器；旧的 per-bundler 适配器逐步让位。

## 2. Vite 配置（unplugin）

```ts
// vite.config.ts
import { stylex } from '@stylexjs/unplugin'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    stylex.vite({ dev: process.env.NODE_ENV === 'development' }),
    react(),
  ],
})
```

`.babelrc` 仍需注册 babel-plugin（`unplugin` 负责打包器侧的 CSS 提取，babel-plugin 负责转换 `stylex.*` 调用）：

```json
{
  "plugins": [
    ["@stylexjs/babel-plugin", { "styleResolution": "property-specificity" }]
  ]
}
```

## 3. babel-plugin 关键选项

| 选项 | 默认 | 作用 |
|------|------|------|
| `styleResolution` | `'property-specificity'` | 合并策略：`property-specificity`（`marginTop` 胜 `margin`，RN 风格）/ `'application-order'`（后写胜，行内风格）。详见 [api-reference.md](api-reference.md) |
| `classNamePrefix` | `'x'` | 生成 class 前缀 |
| `dev` | `false` | 运行时注入 CSS，开发期免提取即可用；附 DevTools 元数据 |
| `debug` | `false` | debug class 名 + `data-style-src` |
| `importSources` | `['@stylexjs/stylex']` | 自定义导入源（库想用别名时） |
| `sxPropName` | `'sx'` | JSX `sx` 简写 prop 名；`false` 禁用 |
| `env` | `{}` | 编译时常量，供 `stylex.env.*`（v0.18+），见 [api-reference.md](api-reference.md) |
| `runtimeInjection` | `false` | 生产运行时注入（一般关） |
| `unstable_moduleResolution` | — | **主题 API 必需**：`{ rootDir, themeFileExtension }` 或 `'commonjs'`/`'export-condition-condition'`，让编译器定位 `.stylex.js` 文件 |
| `aliases` | — | 主题文件跨包路径别名 |
| `test` | — | 限制插件作用范围 |

### ⚠️ 主题必需 `unstable_moduleResolution`

要用 `stylex.defineVars` / `createTheme`（见 [theming.md](theming.md)），必须启用：

```json
{
  "plugins": [
    ["@stylexjs/babel-plugin", {
      "unstable_moduleResolution": { "rootDir": ".", "themeFileExtension": ".stylex.ts" }
    }]
  ]
}
```

不启用则编译器无法识别 `.stylex.js` 文件的命名导出，主题变量报错。

## 4. Next.js 配置

```js
// next.config.mjs
import stylexPlugin from '@stylexjs/nextjs-plugin'

export default {
  transpilePackages: ['@stylexjs/stylex'],
  webpack(config, { isServer }) {
    config.plugins.push(stylexPlugin({ rootDir: __dirname, dev: process.env.NODE_ENV === 'development' }))
    return config
  },
}
```

`rootDir` 用于 `unstable_moduleResolution` 定位主题文件。详见 [../nextjs/references/app-router.md](../../nextjs/references/app-router.md)。

## 5. ESLint 插件

```bash
pnpm add -D @stylexjs/eslint-plugin
```

```json
{
  "plugins": ["@stylexjs"],
  "extends": ["plugin:@stylexjs/recommended"]
}
```

主要规则：
- `valid-shorthands`：把 `margin` 展开为 `marginBlock/Inline` 等逻辑属性（默认）
- `legacy-expand-shorthands`：旧式 `margin-top/bottom` 展开模式（与默认行为不同，慎切）
- `no-unused-plugins` / `no-legacy-api` 等

> v0.19 起支持 ESLint 10。

## 6. PostCSS 配置（无打包器 / 兼容旧流水线）

```ts
// postcss.config.js
module.exports = {
  plugins: [
    require('@stylexjs/postcss-plugin')({
      include: ['src/**/*.{ts,tsx}'],
      // 同 babel-plugin 选项
    }),
  ],
}
```

PostCSS 插件同时承担转换与提取，不需再装 babel-plugin；但失去 `sx` 简写等编译期特性，仅推荐无构建流水线场景。

## 7. CLI（预生成 CSS）

```bash
pnpm add -D @stylexjs/cli
npx stylex compile src/ --outDir dist/stylex --stylexBundleName styles.css
```

适合库发布前预生成原子 CSS、或纯静态站点。

## 8. dev vs 生产

| | dev | 生产 |
|---|-----|------|
| CSS 来源 | 运行时注入（`runtimeInjection`） | 编译时提取到静态 `.css` |
| DevTools | 类名含源信息（`debug: true`） | 哈希类名 |
| 用途 | 本地开发免构建产物 | 部署 |

开发期设 `dev: true` 即可，无需手动管 CSS 文件；生产构建时 unplugin/nextjs-plugin 自动提取聚合。

## 9. 速查

| 需求 | 选择 |
|------|------|
| Vite/Webpack/Rspack | `@stylexjs/unplugin` + babel-plugin |
| Next.js | `@stylexjs/nextjs-plugin` |
| 主题（defineVars/createTheme） | babel-plugin 启用 `unstable_moduleResolution` |
| 纯 PostCSS | `@stylexjs/postcss-plugin`（无 `sx`） |
| 预生成 CSS | `@stylexjs/cli` |
| 代码规范 | `@stylexjs/eslint-plugin` |
| 合并策略 | `styleResolution` |
