# React Compiler

> 面向 React 19.2+ 的 React Compiler 1.0（稳定）。版本敏感，以下来自官方文档核对。编译时自动 memoization，消除手写 `useMemo`/`useCallback`/`React.memo` 的负担。

## 1. 它做什么

React Compiler 是一个**编译时**编译器（babel 插件），分析你的组件与 hook，自动插入等价于手动 `useMemo`/`useCallback` 的记忆化逻辑——**且更精细**：记忆化单个值/JSX 子树，而不是整个组件返回值。

- 输入：普通 React 代码（组件 + hook）
- 输出：相同行为、但内置记忆化的代码
- 收益：无关 props/state 是否变化，只要输入相同就跳过重复计算与重渲染

官方一句话：**让 React 像「你完美写了所有 memo」那样工作**。

## 2. 安装

```bash
pnpm add babel-plugin-react-compiler
# 同时装 ESLint 插件以获取诊断（即使没启用编译器也能用）
pnpm add -D eslint-plugin-react-hooks
```

### Next.js

```js
// next.config.js
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
}
module.exports = nextConfig
```

### Vite / 通用 babel

```js
// babel.config.js
module.exports = {
  presets: [['@babel/preset-react', { runtime: 'automatic' }]],
  plugins: [
    ['babel-plugin-react-compiler', { compilationMode: 'infer' }],  // 默认 infer
  ],
}
```

> **插件顺序**：通常 babel 会自动处理；若你手动编排，让 compiler 在 React preset 之后运行。

### ESLint 配置

```js
// eslint.config.js (flat config)
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  reactHooks.configs.recommended,
  // 或反模式：只拿诊断、不启用编译器
  { plugins: { 'react-hooks': reactHooks }, rules: reactHooks.configs.recommended.rules },
]
```

> **重要**：ESLint 规则包含编译器诊断，**即使你没启用 babel 编译器也能用**——可以先把代码改成符合规则，再开编译器。详见 [rules-and-lint.md](rules-and-lint.md)。

## 3. 编译模式：`compilationMode`

| 模式 | 行为 | 适用 |
|------|------|------|
| `'infer'`（默认） | 按命名自动识别：PascalCase = 组件，`use*` = hook | 全量启用 |
| `'annotation'` | 仅编译带 `"use memo"` 的函数 | **渐进式采纳** |
| `'all'` | 编译所有函数（即使不符合命名） | 实验性，需谨慎 |

```js
['babel-plugin-react-compiler', { compilationMode: 'annotation' }]
```

## 4. 渐进式采纳（推荐路径）

新代码库直接 `infer` 全量启用。**已有代码库**按以下步骤：

1. **先装 ESLint 插件**，不开编译器。运行 `eslint --fix` 后逐条修复 `purity`/`refs`/`set-state-in-effect`/`immutability` 等诊断（见 [rules-and-lint.md](rules-and-lint.md)）。这步让代码符合 Rules of React。
2. **切到 `annotation` 模式**：只在确认安全的叶子组件上加 `"use memo"`，从下往上逐步覆盖。
3. **验证**：React DevTools 里编译过的组件会显示 **Memo ✨** 徽章；或检查编译产物。
4. **稳定后切回 `infer`**：全量启用，移除多余的 `"use memo"`。

## 5. 指令：`"use memo"` / `"use no memo"`

### `"use memo"` — 显式标记编译

```tsx
function Button({ onClick, children }) {
  "use memo";   // 必须是函数体第一行（注释除外）
  // ...
}
```

- 双引号或单引号，**不能用反引号**
- 必须精确写 `"use memo"`
- 仅该函数的第一个指令生效
- 在 `infer` 模式下，命名不规范的函数（如小写开头的"组件"）可用此指令强制编译——但**官方建议改命名**而非加指令

### `"use no memo"` — 完全退出编译

```tsx
function ProblematicComponent({ data }) {
  "use no memo"; // TODO: 移除规则违反后删除此行
  // ...
}
```

- 优先级最高：在 `all` 模式下也生效
- 可放文件顶部，影响整个模块的所有函数；函数级的 `"use no memo"` 覆盖模块级
- 别名 `"use no forget"`
- **官方定位**：临时调试工具，不是永久方案。务必加注释说明为什么退出

何时用 `"use no memo"`：
- 怀疑编译器导致 bug，临时退出以隔离问题
- 第三方库 hook 有副作用、与编译器不兼容时（先短期退出并提 issue）

## 6. 编译库（Compiling Libraries）

如果你发布一个被应用依赖的库，可以让库本身也被编译——但要点：

- 库的编译产物依赖 React 19.2+ 运行时（compiler 生成的代码用到新版内部 API）
- 用 `compilationMode` 配置，建议库导出**源码 + 编译产物**双份
- 应用端启用了 compiler 时，会跳过已编译的库函数（避免双重编译）
- 详见 [官方 Compiling Libraries 指南](https://react.dev/reference/react-compiler/compiling-libraries)

> 对消费方：`"use no memo"` 不要写在库的公共导出上——会让用户也无法编译这些函数。

## 7. 编译器与手动 memo 的关系

| 场景 | 编译器行为 |
|------|-----------|
| 代码里已有 `useMemo`/`useCallback`/`React.memo` | 默认**保留**（`preserve-manual-memoization` 规则检测），因为编译器假设你写 memo 有理由 |
| 手写 memo 有冗余/可优化 | 编译器仍会在此基础之上做进一步记忆化 |
| 想让编译器接管、移除手写 memo | 直接删除手写 memo，让编译器处理 |

> `useMemo` 没有返回值会被 `use-memo` 规则标记（常见错误：`useMemo(() => sideEffect(), deps)`）。

## 8. 何时仍需手动 memo

编译器覆盖 95% 场景，但以下仍需手写：

- **依赖稳定的引用相等性**（如作为 `useEffect` 依赖、传给做了 `===` 比较的库）：编译器保证"输入相同→输出相同"，但具体引用稳定性语义需自己确认
- **跨渲染边界共享同一对象**（罕见）
- **明确的性能热点**，想强制记忆化（配合 `useMemo` 显式声明意图）

## 9. 调试

- **React DevTools**：编译过的组件显示 **Memo ✨** 徽章
- **编译产物**：检查 babel 输出，确认 `_c`（缓存槽位）调用被插入
- **ESLint 诊断**：编译器跳过违规函数但**报告诊断**——修复诊断能扩大编译覆盖
- **`"use no memo"` 隔离法**：怀疑某组件编译有问题时，加 `"use no memo"` 看是否复现

## 10. 配置选项速查

| 选项 | 取值 | 说明 |
|------|------|------|
| `compilationMode` | `'infer'` / `'annotation'` / `'all'` | 默认 `infer` |
| `target` | React 版本字符串（如 `'19'`） | 跨版本兼容（库场景） |
| `panicThreshold` | `'ALL_ERRORS'` / `'CRITICAL_ERRORS'` | 编译器遇错时是否 panic |
| `logger` | `{ onCompile(...)... }` | 编译事件回调（统计覆盖率） |
| `gating` | 见 [官方 gating 文档](https://react.dev/reference/react-compiler/gating) | 按环境/特性开关编译 |

## 11. 速查

| 需求 | 做法 |
|------|------|
| 新代码库全量启用 | `compilationMode: 'infer'` + ESLint recommended |
| 老代码库渐进采纳 | 先 ESLint 修诊断 → `annotation` + `"use memo"` 从叶子开始 → 稳定后切 `infer` |
| 强制编译命名不规范的函数 | 加 `"use memo"`（或改命名，官方推荐后者） |
| 临时退出编译 | `"use no memo"` + 注释说明原因 |
| 验证编译生效 | DevTools 看 Memo ✨ 徽章 / 检查产物 `_c` 调用 |
| 仅获取诊断不启用编译器 | 装 `eslint-plugin-react-hooks`，配置 recommended（见 [rules-and-lint.md](rules-and-lint.md)） |
| 库被编译 | 产物依赖 React 19.2+，导出源码+产物双份 |
