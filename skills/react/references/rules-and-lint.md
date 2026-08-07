# Rules of React + ESLint v6

> React 官方「Rules of React」+ `eslint-plugin-react-hooks` v6（2026）。规则是**强约束**——违反大概率有 bug，且 React Compiler 会跳过违规函数。版本敏感，以下来自官方文档核对。

## 1. 三大 Rules of React

### 1.1 Components and Hooks must be pure（必须纯）

让应用可预测、可调试、可被 React 自动优化。

- **幂等**：相同 props/state/context → 相同输出。多次调用结果一致。
- **副作用必须在 render 之外**：render 中不要改外部状态、发请求、写 DOM。React 可能为了最佳体验多次渲染。
- **props/state 不可变**：单次渲染内是快照。绝不直接改 `props.x = 1` 或 `state.x.y = 1`（用 `setState(updater)`）。
- **传给 hook 的参数不可变**：值进入 hook 后就像进入 JSX 一样不可变。
- **传给 JSX 的值不可变**：`<Foo x={obj} />` 之后不要改 `obj`——在创建 JSX 之前改完。

### 1.2 React calls Components and Hooks（React 负责调用）

声明式：你告诉 React 渲染什么，React 决定何时、如何渲染。

- **绝不直接调用组件函数**：`<Component />` 是唯一用法，不要 `Component()` 当函数调。
- **绝不把 hook 当普通值传递**：`const h = useState; h(0)` 违规。hook 只能在组件/hook 内部直接调用。

### 1.3 Rules of Hooks

- **只在顶层调用**：不要在循环、条件、嵌套函数里调 hook。在早返回之前。
- **只从 React 函数里调用**：组件或自定义 hook。普通 JS 函数不能调。

> 与 [core-hooks.md](core-hooks.md) 的 hook 心智模型互参。

## 2. ESLint 插件 v6 概览

`eslint-plugin-react-hooks` 的 `recommended` 预设包含两类规则：

1. **基础规则**：`exhaustive-deps`、`rules-of-hooks`（v5 时代就有）
2. **编译器诊断规则**：v6 新增，由 React Compiler 静态分析产生，**即使你没启用 babel 编译器也会跑**

关键事实：编译器检测到违规时，会**自动跳过**该函数（其余仍编译），并报告诊断。你不必立刻修完所有诊断——按节奏修，逐步扩大编译覆盖。

### 配置（flat config）

```js
// eslint.config.js
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  reactHooks.configs.recommended,   // 含全部 recommended 规则
]
```

antfu ESLint 配置见 [../foundation/references/eslint-antfu.md](../foundation/references/eslint-antfu.md)。

## 3. 规则速查表（v6 recommended）

| 规则 | 检测 | 典型违规 |
|------|------|----------|
| `rules-of-hooks` | hook 调用位置 | 在条件/循环里调 hook |
| `exhaustive-deps` | effect 依赖数组 | 漏了用到的外部变量 |
| `component-hook-factories` | 高阶函数定义嵌套组件/hook | 工厂函数返回的组件/hook 上下文错乱 |
| `config` | 编译器配置 | 配置项非法 |
| `error-boundaries` | 错误边界用法 | 用 try/catch 捕获子组件渲染错误（应用 Error Boundary） |
| `gating` | gating 模式配置 | — |
| `globals` | render 中改全局 | render 里 `window.x = 1` / `Date.now()` 当依赖 |
| `immutability` | 改 props/state/不可变值 | `props.list.push(1)` / `state.x = 2` |
| `incompatible-library` | 与 memoization 不兼容的库 | 用了已知会破坏 memo 的库 API |
| `preserve-manual-memoization` | 手写 memo 被编译器误改 | 编译器未保留 `useMemo`/`memo` |
| `purity` | 已知不纯函数 | render 里调 `Math.random()`/`Date.now()`/读可变全局 |
| `refs` | ref 误用 | render 中读写 `ref.current`（应在 effect/event） |
| `set-state-in-effect` | effect 同步 setState | `useEffect(() => setState(x))` 无条件 |
| `set-state-in-render` | render 中 setState | 渲染过程中直接 `setState`（除"派生 state"模式） |
| `static-components` | 组件静态性 | 组件每次渲染被重新创建（违反"React 调用"） |
| `unsupported-syntax` | 编译器不支持的语法 | 用了编译器无法分析的语法 |
| `use-memo` | `useMemo` 误用 | `useMemo(() => sideEffect(), deps)` 无返回值 |

## 4. 常见违规与修复

### 4.1 `purity`：render 中调用不纯函数

```tsx
// ❌
function Foo() {
  const id = Math.random()   // 不纯
  const now = Date.now()     // 不纯
  return <div>{id}{now}</div>
}

// ✅ 移到 effect / event / useState 初始化（lazy initializer）
function Foo() {
  const [id] = useState(() => Math.random())  // 仅初始化时一次
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  return <div>{id}{now}</div>
}
```

### 4.2 `refs`：render 中读写 `ref.current`

```tsx
// ❌
function Foo({ ref }) {
  if (ref.current === null) ref.current = computeInitial()  // render 中写
  return <div ref={ref} />
}

// ✅ 用 lazy initializer 或 effect
function Foo({ ref }) {
  const [init] = useState(computeInitial)
  useEffect(() => { ref.current = init }, [init, ref])
  return <div ref={ref} />
}
```

### 4.3 `set-state-in-effect`：effect 无条件 setState

```tsx
// ❌ 无条件 → 无限循环风险 / 多余渲染
function Foo({ value }) {
  const [derived, setDerived] = useState(null)
  useEffect(() => { setDerived(transform(value)) }, [value])
  return <div>{derived}</div>
}

// ✅ 优先用 useMemo / 直接计算（render 期）
function Foo({ value }) {
  const derived = useMemo(() => transform(value), [value])
  return <div>{derived}</div>
}
```

> 详见 [core-hooks.md](core-hooks.md) 的「You Might Not Need an Effect」与 effect 心智模型。

### 4.4 `immutability`：直接改 state

```tsx
// ❌
function addTodo(list, todo) {
  list.push(todo)            // 改了入参（可能是 state）
  return list
}

// ✅ 不可变更新
function addTodo(list, todo) {
  return [...list, todo]
}
```

### 4.5 `error-boundaries`：用 try/catch 捕获子组件错误

```tsx
// ❌ 捕不到子组件渲染错误（子组件在 try 之外渲染）
function Parent() {
  try { return <Child /> }
  catch (e) { return <Fallback /> }
}

// ✅ Error Boundary（仍是 class，见 component-patterns.md）
class MyBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    return this.state.error ? <Fallback error={this.state.error} /> : this.props.children
  }
}
function Parent() { return <MyBoundary><Child /></MyBoundary> }
```

## 5. 与 React Compiler 的关系

- 编译器**静态分析**产生诊断 → ESLint 插件**自动呈现**这些诊断
- 编译器遇违规 → 自动跳过该函数（**不报错**，只是不优化）
- 因此：**修诊断 = 扩大编译覆盖**，不必一次修完

推荐工作流：先开 ESLint（不开编译器） → 修诊断 → 开 `annotation` 模式编译 → 切 `infer`。详见 [react-compiler.md](react-compiler.md)。

## 6. Strict Mode 配合

`<StrictMode>` 在开发环境**故意双调用** render/effect，用来暴露 purity 违规。**必须配合 ESLint 使用**——两者互补：

- ESLint：静态捕获（编译时）
- Strict Mode：运行时捕获（如 render 中读了可变全局、effect 副作用未清理）

```tsx
createRoot(container, {
  onUncaughtError: (error, errorInfo) => {
    // errorInfo.componentStack + 可选 captureOwnerStack()（见 miscellaneous-apis.md）
  },
}).render(<StrictMode><App /></StrictMode>)
```

## 7. 速查

| 需求 | 选择 |
|------|------|
| 强制 hook 规则 | `rules-of-hooks` + `exhaustive-deps` |
| 静态捕获 Rules 违规 | v6 recommended 全套（即使不开编译器） |
| render 中不纯 | 查 `purity` / `globals` / `set-state-in-render` |
| 改 state/props | 查 `immutability` |
| ref 误用 | 查 `refs` |
| effect 乱 setState | 查 `set-state-in-effect`（优先改用 useMemo） |
| 子组件错误 | 用 Error Boundary（`error-boundaries` 规则） |
| 扩大编译器覆盖 | 修编译器诊断（ESLint 自动呈现），见 [react-compiler.md](react-compiler.md) |
| 运行时查 purity | `<StrictMode>` 双调用 |
