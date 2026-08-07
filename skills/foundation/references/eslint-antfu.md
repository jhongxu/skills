# @antfu/eslint-config

> 面向 `@antfu/eslint-config@9.2`（要求 ESLint v9.5.0+）。Anthony Fu 的个人 ESLint Flat config 预设，React 栈默认用它替代 Prettier + ESLint 的组合。一行配置开箱即用，单引号无分号、import 排序、尾逗号，自动 fix 即格式化。

为什么用它：Flat config 组合方便、自动检测 TypeScript/JSX/Vue、内置 JSON/YAML/Toml/Markdown lint、可选 React/Next.js/UnoCSS、用 ESLint Stylistic 替代 Prettier（一个工具搞定 lint + 格式化）、默认尊重 `.gitignore`。

## 1. 安装与一行配置

```bash
pnpm add -D eslint @antfu/eslint-config
```

```js
// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu()
```

```jsonc
// package.json
{
  "scripts": {
    "lint": "eslint",
    "lint:fix": "eslint --fix"
  }
}
```

想用向导初始化或从旧 eslintrc 迁移：

```bash
pnpm dlx @antfu/eslint-config@latest
```

> Flat config 下 `.eslintignore` 不再生效，忽略路径用配置里的 `ignores` 字段。

## 2. 基础选项

```js
// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',              // 'app'（默认）| 'lib'。库更严格，会检查 export 形状等
  stylistic: true,          // 开风格规则（默认开）
  // 或细控：
  // stylistic: {
  //   indent: 2,            // 2 | 4 | 'tab'
  //   quotes: 'single',     // 'single' | 'double'
  //   jsx: true,
  // },

  // TypeScript 和 Vue 自动检测，也可显式开：
  typescript: true,
  vue: true,

  // 关掉不需要的语言支持：
  jsonc: false,
  yaml: false,
  toml: false,
  markdown: false,

  // 忽略（替代 .eslintignore）
  ignores: [
    '**/fixtures',
    '**/dist/**',
    '**/.output/**',
  ],
})
```

## 3. React / Next.js

```js
import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,          // 开 eslint-plugin-react + react-hooks
  nextjs: true,         // 在 react 基础上开 @next/eslint-plugin-next
  // 细控：
  // react: {
  //   overrides: {
  //     'react/jsx-no-leaked-render': 'off',
  //   },
  // },
})
```

开启后自动加载 react 规则与 hooks 规则（含新的 `react-hooks/exhaustive-deps` 强化版，配合 React Compiler）。

## 4. 规则覆盖

工厂函数第二个参数起是原生 ESLint Flat Config 对象，按需叠加：

```js
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    react: true,
    typescript: true,
  },
  // 指定文件 glob 的覆盖
  {
    files: ['**/*.tsx'],
    rules: {
      'react/jsx-no-leaked-render': 'off',
    },
  },
  // 不带 files = 全局规则
  {
    rules: {
      'style/semi': ['error', 'never'],   // 强制无分号
    },
  },
)
```

或在集成选项里用 `overrides`（更简洁）：

```js
export default antfu({
  typescript: {
    overrides: {
      'ts/consistent-type-definitions': ['error', 'interface'],
    },
  },
  vue: {
    overrides: {
      'vue/operator-linebreak': ['error', 'before'],
    },
  },
})
```

> 注意：`ts/*` 规则只在 `.ts` 文件生效，`vue/*` 只在 `.vue` 生效。覆盖时记得带 `files` glob。

## 5. 插件重命名（重要）

antfu 把插件前缀重命名成更短统一的形式，写 inline disable 时要用新前缀：

| 新前缀 | 原前缀 | 来源插件 |
|--------|--------|----------|
| `import/*` | `import-lite/*` | eslint-plugin-import-lite |
| `node/*` | `n/*` | eslint-plugin-n |
| `yaml/*` | `yml/*` | eslint-plugin-yml |
| `ts/*` | `@typescript-eslint/*` | @typescript-eslint |
| `style/*` | `@stylistic/*` | @stylistic/eslint-plugin |
| `test/*` | `vitest/*`, `no-only-tests/*` | @vitest/eslint-plugin, eslint-plugin-no-only-tests |
| `next/*` | `@next/next` | @next/eslint-plugin-next |

```diff
-// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
+// eslint-disable-next-line ts/consistent-type-definitions
type foo = { bar: 2 }
```

v2.9.0 起，预设会自动给**你的自定义配置**也做重命名，所以你也可以用原前缀覆盖。想完全还原原前缀：

```js
export default antfu()
  .renamePlugins({
    ts: '@typescript-eslint',
    yaml: 'yml',
    node: 'n',
  })
```

## 6. Composer（链式组合）

`antfu()` 返回 `FlatConfigComposer`（来自 `eslint-flat-config-utils`），可链式 prepend/override/rename：

```js
import antfu from '@antfu/eslint-config'

export default antfu()
  .prepend(
    // 放在主配置之前的配置
  )
  .override('antfu/stylistic/rules', {
    rules: {
      'style/generator-star-spacing': ['error', { after: true, before: false }],
    },
  })
  .renamePlugins({
    'old-prefix': 'new-prefix',
  })
  .append({
    rules: { /* ... */ },
  })
```

## 7. Formatters（替代 Prettier 格式化非 JS 文件）

可选开启，用 eslint-plugin-format 格式化 CSS/HTML/XML 等：

```js
export default antfu({
  formatters: true,       // 开所有格式化
  // 或细控（false 表示该文件类型不格式化）：
  // formatters: {
  //   css: true,
  //   html: true,
  //   markdown: 'prettier',   // 'prettier' | 'dprint'
  //   toml: true,
  //   graphql: true,
  //   images: false,
  //   slack: false,
  // },
})
```

需要 `eslint-plugin-format` 装好。开启后 antfu 就是**唯一的格式化工具**，不再需要 Prettier。

## 8. 细粒度组合（高级）

不推荐日常用，但需要精确控制时可拆：

```js
import {
  combine, comments, ignores, imports, javascript, jsdoc,
  jsonc, markdown, node, sortPackageJson, sortTsconfig,
  stylistic, toml, typescript, unicorn, vue, yaml,
} from '@antfu/eslint-config'

export default combine(
  ignores(),
  javascript(),
  comments(),
  node(),
  jsdoc(),
  imports(),
  unicorn(),
  typescript(),
  stylistic(),
  vue(),
  jsonc(),
  yaml(),
  toml(),
  markdown(),
  sortPackageJson(),
  sortTsconfig(),
)
```

## 9. VS Code 配置（保存自动 fix）

装 ESLint 扩展，`.vscode/settings.json`：

```jsonc
{
  "prettier.enable": false,
  "editor.formatOnSave": false,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },
  // 静默风格规则的红线（仍会 auto fix），减少视觉噪音
  "eslint.rules.customizations": [
    { "rule": "style/*", "severity": "off", "fixable": true },
    { "rule": "format/*", "severity": "off", "fixable": true },
    { "rule": "*-indent", "severity": "off", "fixable": true },
    { "rule": "*-spacing", "severity": "off", "fixable": true },
    { "rule": "*-order", "severity": "off", "fixable": true },
    { "rule": "*-dangle", "severity": "off", "fixable": true },
    { "rule": "*quotes", "severity": "off", "fixable": true },
    { "rule": "*semi", "severity": "off", "fixable": true }
  ],
  "eslint.validate": [
    "javascript", "javascriptreact", "typescript", "typescriptreact",
    "vue", "html", "markdown", "json", "jsonc", "yaml", "toml",
    "astro", "svelte", "css", "less", "scss"
  ]
}
```

## 10. 与 React Compiler 配合

React Compiler 1.0 后，hooks 规则强化。antfu 的 react 集成加载 `eslint-plugin-react-hooks`，包含：

- `react-hooks/rules-of-hooks`：hook 调用规则
- `react-hooks/exhaustive-deps`：依赖完整性（Compiler 下可更严格）
- 新增 `react-hooks/component-hook-factories`、`react-hooks/set-state-in-effect` 等规则

详见 [react-compiler](../../react/references/react-compiler.md) 与 [rules-and-lint](../../react/references/rules-and-lint.md)。

## 11. 与本仓库其他 skill 的衔接

- 用 [pnpm](pnpm.md) 装。
- 测试代码用 [vitest](vitest.md)；antfu 内置 `test/*` 规则（vitest 插件）会 lint 测试文件。
- 配 [unocss](unocss.md) 时开 `unocss: true` 校验 class 名。
- React 项目见 [react](../react/SKILL.md) skill；Next.js 见 [nextjs](../nextjs/SKILL.md) skill。

## 12. 坑

| 坑 | 说明 |
|----|------|
| `.eslintignore` 不生效 | Flat config 不支持，用 `ignores: [...]` |
| inline disable 不生效 | 插件前缀改了，用新前缀（`ts/*` 而非 `@typescript-eslint/*`） |
| ESLint 版本太低 | 要求 v9.5.0+；升 ESLint |
| 升级后一堆新报错 | antfu 是个人 config，升级前看 release notes；`lessOpinionated: true` 可减少意见规则 |
| React 规则不生效 | 没开 `react: true`；或没装 `eslint-plugin-react`（antfu 已内置，但确认 peer） |
| 既有 eslintrc 配置想一起用 | 用 `@eslint/eslintrc` 的 `FlatCompat` 转成 flat config 再 spread 进 `antfu(...)` |
| `ts/*` 覆盖不生效 | 规则只在 `.ts` 生效，覆盖时带 `files: ['**/*.ts']` |
| Prettier 冲突 | 开了 antfu 就卸 Prettier 或关 `editor.formatOnSave`，否则两边打架 |
| 大项目 lint 慢 | 用 `eslint --cache`；或 `eslint.config.ts` 里按 `files` 拆分减少匹配范围 |
