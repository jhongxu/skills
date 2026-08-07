# tsdown

> 面向 `tsdown@0.22`（基于 Rolldown + Oxc，`rolldown@1.2`）。打包 TypeScript 库的事实标准，esbuild/tsup 的继任者。**构建期**要求 Node.js 22.18+，但产物可通过 `target` 降到 Node 18/20。

为什么用它：Rolldown（Rust 写的 rollup 兼容打包器）+ Oxc（Rust 写的 JS parser/transformer）带来比 tsup 快一个数量级的构建；零配置即可产出 ESM/CJS + dts；原生支持 React/Vue/Solid/Svelte 的 JSX；插件系统兼容 Rollup/Rolldown 插件。

## 1. 安装与最小配置

```bash
pnpm add -D tsdown
```

`package.json`：

```jsonc
{
  "scripts": {
    "build": "tsdown"
  }
}
```

零配置时默认入口 `src/index.ts`，输出到 `dist/`，格式 `es`。`tsdown` 命令读 `tsdown.config.ts`（找不到就用默认）。

最小 `tsdown.config.ts`：

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['es'],
  dts: true,            // 生成 .d.ts；默认看 package.json 有没有 types 字段自动决定
  clean: true,          // 构建前清 dist
  outDir: 'dist',
})
```

## 2. 多格式输出（库标配）

React 库通常要同时出 ESM + CJS + dts，并在 `package.json` 用 `exports` 字段分发：

```ts
// tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['es', 'cjs'],     // ESM + CJS 双格式
  dts: true,                 // 生成一份 .d.ts
  fixedExtension: true,      // 强制 .mjs/.cjs，避免 dual-package hazard
  outDir: 'dist',
})
```

```jsonc
// package.json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts"
}
```

> `fixedExtension: true` 让输出固定为 `.mjs`/`.cjs`，配合 `exports` 字段最稳。不开启时扩展名跟随 `package.json` 的 `type` 字段。

`exports` 字段还能让 tsdown 自动生成（实验性）：`exports: true` 会写 `main`/`module`/`types`/`exports` 到 `package.json`。

## 3. target / platform

`target` 决定降级到哪个 JS 版本；`platform` 决定运行环境假设：

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  target: 'node18',       // 'es2020' | 'node18' | 'node20' | ['node18','es2020'] | false
  platform: 'node',      // 'node'（默认）| 'neutral' | 'browser'
                           // CJS 格式下 platform 永远是 node，不能改
  minify: false,         // true | false | 'dce-only'（只做死代码消除，不压缩）
  sourcemap: true,       // true | false | 'inline' | 'hidden'
})
```

不设 `target` 时，默认读 `package.json` 的 `engines.node`。**关键**：CI 用 Node 22+ 构建，但用 `target: 'node18'` 让产物跑在低版本。

## 4. external / noExternal（依赖怎么处理）

默认把 `dependencies` / `peerDependencies` 当 external（不打包进产物），把 `devDependencies` 打进去。精确控制：

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  external: ['react', 'react-dom'],     // 这些不打包
  noExternal: ['lodash-es'],            // 这些强制打包
  // skipNodeModulesBundle: true,       // 粗暴：所有 node_modules 都 external
})
```

`noExternal` 也接受函数：`(id, importer) => true`。

## 5. dts（声明文件）

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,            // 简单：用默认选项
  // dts: {             // 或对象细控
  //   compilerOptions: { /* 覆盖 tsconfig */
  //     stripInternal: true,
  //   },
  // },
})
```

dts 由 `rolldown-plugin-dts` 生成，和构建在同一个进程里跑（比 tsup 的分离 dts 快）。默认行为：`package.json` 有 `types` 字段就开，没有就关。

## 6. unbundle 模式（保留文件结构）

默认 bundle 成单文件。`unbundle: true` 让输出镜像源码结构（一个源文件 → 一个产物文件），适合大型库减少产物体积、改善 tree-shaking：

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  unbundle: true,      // 输出 dist/foo.js, dist/bar.js... 而非单个 index.mjs
})
```

> `bundle` 选项已废弃，用 `unbundle`（语义反转）。

## 7. JSX / React / Vue

tsdown 内建 React/Vue/Solid/Svelte 的 JSX transform，无需额外插件。检测到项目装了对应框架就自动配：

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  // React: 自动用 react/jsx-runtime（React 17+ 的 automatic runtime）
  // Vue: 自动配 @vue/babel-plugin-jsx
  // 显式指定 JSX 模式（多框架共存时）：
  jsx: 'react',    // 'preserve' | 'react' | 'vue'
})
```

## 8. 插件系统（兼容 Rolldown/Rollup 插件）

```ts
import { defineConfig } from 'tsdown'
import { wasm } from 'rolldown-plugin-wasm'

export default defineConfig({
  entry: ['src/index.ts'],
  plugins: [
    wasm(),          // 直接 import './add.wasm'
  ],
})
```

WASM 插件选项：

```ts
wasm({
  maxFileSize: 14 * 1024,        // 超过就拷成文件而不是 inline（默认 14KB）
  fileName: '[hash][extname]',
  targetEnv: 'auto',             // 'auto' | 'auto-inline' | 'browser' | 'node'
})
```

导入方式：

```ts
import { add } from './add.wasm'        // 同步
import init from './add.wasm?init'      // 异步 init
import initSync from './add.wasm?init&sync'  // 同步 init
```

## 9. define / env（编译期常量）

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  define: {
    __DEV__: 'false',
    'process.env.NODE_ENV': '"production"',   // 注意字符串里的引号
  },
  env: {
    DEBUG: true,
    NODE_ENV: 'production',
  },
})
```

## 10. hooks / onSuccess

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  hooks: {
    'build:prepare': async (config) => { /* 构建前 */ },
    'build:done': async (context) => { /* 构建后 */ },
  },
  onSuccess: 'node ./post-build.js',    // 字符串：跑命令（watch 模式友好）
  // onSuccess: async (config, signal) => { /* 或函数 */ },
})
```

## 11. workspace 模式（monorepo）

实验性，给 monorepo 多包构建：

```ts
// 根 tsdown.config.ts
export default defineConfig({
  workspace: true,          // 自动发现所有子包的 tsdown.config.ts
  // workspace: ['packages/*'],   // 或指定 glob
  filter: ['@my/ui', '@my/utils'],  // 只构建这些
})
```

每个子包放自己的 `tsdown.config.ts`，根配置跑它们。配合 [pnpm](pnpm.md) 的 workspace 一起用。

## 12. CLI

```bash
tsdown                     # 构建
tsdown --watch             # watch 模式
tsdown --minify            # 压缩
tsdown --dts               # 强制生成 dts
tsdown --format es,cjs     # 覆盖格式
tsdown --target node18     # 覆盖 target
tsdown --no-clean          # 不清 dist
tsdown --silent            # 静默
tsdown --config ./my.tsdown.config.ts
```

## 13. publint / attw（发布前检查）

```ts
export default defineConfig({
  entry: ['src/index.ts'],
  publint: true,    // 跑 publint 检查 package.json 字段是否正确（需装 publint）
  attw: true,       // 跑 arethetypeswrong 检查 .d.ts 导出是否对（需装 @arethetypeswrong/core）
  unused: true,     // 跑 unplugin-unused 检查没用到的依赖（需装 unplugin-unused）
})
```

发布库前开这三个，能拦住 `exports` 字段配错、dts 路径不对、依赖没声明等常见问题。

## 14. 与本仓库其他 skill 的衔接

- 用 [pnpm](pnpm.md) 装；workspace 模式配合 pnpm workspace。
- 库的测试用 [vitest](vitest.md)；tsdown 的 `fromVite: true` 可复用 vite/vitest 配置。
- 代码风格用 [eslint-antfu](eslint-antfu.md)；tsdown 自己也用 antfu config。
- 打包 React 组件库时，产物给 [react](../react/SKILL.md) / [ui](../ui/SKILL.md) skill 的项目消费。

## 15. 坑

| 坑 | 说明 |
|----|------|
| `bundle: false` 不生效 | 已废弃，改用 `unbundle: true`（语义反转） |
| Node 版本不够构建失败 | tsdown 运行要 Node 22.18+，CI 升 Node；产物用 `target` 降级 |
| 双格式 dual-package hazard | 开 `fixedExtension: true` + 正确的 `exports` 字段 |
| dts 没生成 | `package.json` 没 `types` 字段时默认关；显式 `dts: true` |
| 体积大 | 检查 `noExternal` 是否把不该打包的依赖打进去了；开 `treeshake: true`（默认开） |
| WASM 导入报类型错 | 在 `tsconfig.json` 的 `compilerOptions.types` 加 `'rolldown-plugin-wasm/types'` |
| peer dependency 被打包 | 默认 external，但若写在 `dependencies` 里会被打包；改放 `peerDependencies` |
