# Core Hooks

> 面向 React 19.2+。本篇聚焦「在 19 里该怎么用」，不重复 react.dev 的参数表。性能优化见 [../react-best-practices/SKILL.md](../../react-best-practices/SKILL.md)；并发/Suspense 见 [concurrent-features.md](concurrent-features.md)。

## 状态

### `useState` — 函数式更新避免闭包陷阱

```tsx
const [count, setCount] = useState(0)

// ✅ 基于前值
setCount(c => c + 1)

// ❌ 闭包旧值（连续调用只生效一次）
setCount(count + 1)
```

需要「一次事件里多次更新」或派生状态时，优先函数式更新，而不是读外层 `count`。

### `useReducer` — 状态逻辑超过两条分支就换它

```tsx
type State = { status: 'idle' | 'loading' | 'error' | 'success'; data?: User; error?: string }
type Action =
  | { type: 'fetch' }
  | { type: 'success'; data: User }
  | { type: 'error'; error: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'fetch': return { ...state, status: 'loading', error: undefined }
    case 'success': return { status: 'success', data: action.data }
    case 'error': return { status: 'error', error: action.error }
  }
}

const [state, dispatch] = useReducer(reducer, { status: 'idle' })
```

规则：状态转移有 3+ 分支、或下一态依赖多个字段 → 用 `useReducer`。简单独立值用 `useState`。

## 副作用

### `useEffect` — 默认别用，问一句「这能不能算渲染」

90% 的 `useEffect` 滥用是把它当成「组件挂载后跑代码」的地方。先问：

- **派生数据** → 直接在渲染中算（`const filtered = list.filter(...)`），不要 `useEffect + setState`。
- **响应事件** → 放事件处理器里，不是 Effect。
- **同步外部系统**（订阅、DOM 测量、网络） → 这才是 `useEffect` 的本职。

```tsx
// ✅ 同步外部 store
useEffect(() => {
  const unsub = store.subscribe(setValue)
  return unsub
}, [store])
```

### `useEffectEvent` — 把「最新值」从 Effect 依赖里剥离（19.2 稳定）

Effect 需要读最新的 prop/state，但又不希望该值变化时重启 Effect。旧办法是 `useRef` 套娃，19.2 起用 `useEffectEvent`：

```tsx
function Chat({ roomId, onMessage }: { roomId: string; onMessage: (m: string) => void }) {
  const readLatestMessage = useEffectEvent(onMessage) // 非响应式，不进依赖

  useEffect(() => {
    const conn = createConnection(roomId)
    conn.on('message', m => readLatestMessage(m)) // 永远拿到最新 onMessage
    conn.connect()
    return () => conn.disconnect()
  }, [roomId]) // ✅ 只在 roomId 变化时重连，onMessage 变化不重连
}
```

约束（官方）：
- 返回的函数**只能在 Effect 里调用**，不能在渲染中调用。
- **不要**把它放进任何 Effect 的依赖数组（eslint-plugin-react-hooks 会报错）。

### `useLayoutEffect` vs `useEffect`

需要「在浏览器绘制前读取 DOM 布局并同步改样式」（如 tooltip 定位、测量后设样式）才用 `useLayoutEffect`。否则一律 `useEffect`——`useLayoutEffect` 会阻塞绘制。

## 记忆化与 React Compiler

### React Compiler 1.0 已稳定（2025-10）

启用 babel 插件 `babel-plugin-react-compiler` 后，编译器自动为 `useMemo`/`useCallback`/`memo` 插桩。**手写记忆化的主要场景已被消除**：

```tsx
// 19 之后：直接写，编译器兜底
function ProductList({ items, query }: { items: Item[]; query: string }) {
  const filtered = items.filter(i => i.name.includes(query)) // 编译器自动 memo
  return <ul>{filtered.map(i => <li key={i.id}>{i.name}</li>)}</ul>
}
```

未启用编译器时，仍需在「计算昂贵 + 依赖稳定」时手写 `useMemo`；以及把对象/函数作为 prop 传给被 `memo` 包裹的子组件时用 `useMemo`/`useCallback` 保持引用稳定。

判断「昂贵」用 profiler，别凭感觉给每个值都包。

## 引用：`useRef` 与 ref as prop

### 两种用途

```tsx
// 1) 可变值容器（不触发重渲染）
const timerRef = useRef<number | null>(null)
timerRef.current = setInterval(...) // 读写均不触发渲染

// 2) DOM 访问
const inputRef = useRef<HTMLInputElement>(null)
inputRef.current?.focus()
```

### ref as prop — `forwardRef` 已退休（19）

```tsx
// ✅ React 19：ref 当普通 prop，无需 forwardRef
function Input({ label, ref }: { label: string; ref?: Ref<HTMLInputElement> }) {
  return (
    <label>
      {label}
      <input ref={ref} />
    </label>
  )
}

// 使用
const ref = useRef<HTMLInputElement>(null)
<Input label="邮箱" ref={ref} />
```

新代码不要写 `forwardRef`。库的公共 API 若要兼容 18，仍保留 `forwardRef` 一段时间。

### ref cleanup 函数

```tsx
<div ref={el => {
  // el 为 null 表示卸载
  if (!el) return
  const obs = new IntersectionObserver(...)
  obs.observe(el)
  return () => obs.disconnect() // ✅ 19 支持清理函数
}} />
```

### `useImperativeHandle` — 暴露受控 API

```tsx
function Video({ ref }: { ref?: Ref<VideoHandle> }) {
  useImperativeHandle(ref, () => ({
    play: () => videoEl.play(),
    pause: () => videoEl.pause(),
  }), [])
}
```

## 上下文：`useContext` 与 Context as Provider

### `<Context>` 直接当 Provider（19）

```tsx
// 19：Context 本身即可作为 Provider，无需 .Provider
<ThemeContext value="dark">
  <App />
</ThemeContext>
```

旧写法 `<ThemeContext.Provider value="dark">` 仍兼容，新代码用前者。

### `use` — 条件读取 context（19）

`useContext` 必须在顶层调用；`use` 可以放进 `if`：

```tsx
function Row({ showAvatar }: { showAvatar: boolean }) {
  if (showAvatar) {
    const theme = use(ThemeContext) // ✅ 条件里读 context
    return <Avatar theme={theme} />
  }
  return <Spacer />
}
```

读 Promise 的 `use` 见 [concurrent-features.md](concurrent-features.md)。

## 标识：`useId`

```tsx
const id = useId()
return (
  <label htmlFor={id}>
    <input id={id} />
  </label>
)
```

SSR/CSR 一致，避免 hydration mismatch。不要拿它做 `key`（`key` 应来自数据）。

## 表单与 Actions（19）

四个新 API 共同组成「Actions」体系：异步 transition + pending + 乐观更新 + 表单重置全由 React 接管。

### `useActionState` — 给 Action 配状态机

```tsx
async function updateName(_prev: unknown, formData: FormData) {
  const error = await api.updateName(formData.get('name') as string)
  return error ?? null
}

function UpdateName() {
  const [error, submitAction, isPending] = useActionState(updateName, null)
  return (
    <form action={submitAction}>
      <input name="name" disabled={isPending} />
      <button disabled={isPending}>保存</button>
      {error && <p>{error}</p>}
    </form>
  )
}
```

- 第三个返回值 `isPending` 替代手写的 `useState(false)`。
- 第三参 `permalink`（可选）：JS 未加载时表单提交会导航到该 URL，实现渐进增强。

### `useFormStatus` — 子组件读取所属 `<form>` 状态（无需 prop 透传）

```tsx
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>{pending ? '提交中…' : '提交'}</button>
}

// 父组件里直接放进去，不用传 isPending
<form action={submitAction}>
  <SubmitButton />
</form>
```

来自 `react-dom`，不是 `react`。只对作为 `<form>` 后代的组件生效。

### `useOptimistic` — 乐观更新 + 自动回滚

```tsx
function ThumbsUp({ likes, addLike }: { likes: number; addLike: () => Promise<void> }) {
  const [optimisticLikes, addOptimistic] = useOptimistic(likes, (state, _: void) => state + 1)

  return (
    <button
      disabled={optimisticLikes !== likes /* pending */}
      onClick={async () => {
        addOptimistic()            // 立即 +1
        await addLike()            // transition 完成后自动回到真实值
      }}
    >
      👍 {optimisticLikes}
    </button>
  )
}
```

只在 transition 内调用 `addOptimistic`；transition 结束（成功或失败）后值回到 `likes`，失败时由错误边界接管。

> Server Functions（`'use server'`）与 `useActionState` 的配合见 [server-components.md](server-components.md)。

## 外部 store：`useSyncExternalStore`

为 zustand/Redux 等外部状态库设计的并发安全订阅接口：

```tsx
function useOnlineStatus() {
  return useSyncExternalStore(
    cb => {
      window.addEventListener('online', cb)
      window.addEventListener('offline', cb)
      return () => {
        window.removeEventListener('online', cb)
        window.removeEventListener('offline', cb)
      }
    },
    () => navigator.onLine,        // client snapshot
    () => true,                     // server snapshot（SSR 一致性）
  )
}
```

自建状态库务必用 `useSyncExternalStore`，否则在并发渲染下会出现 tearing（不同组件读到不同快照）。

## `useInsertionEffect`

CSS-in-JS 库专用（在 DOM 变更前插入样式）。业务代码不用碰。

## 速查：该用哪个

| 需求 | 选择 |
|------|------|
| 简单独立状态 | `useState` |
| 多分支状态机 | `useReducer` |
| 同步外部系统 | `useEffect` |
| Effect 里读最新值但不重跑 | `useEffectEvent`（19.2） |
| 绘制前测 DOM | `useLayoutEffect` |
| 昂贵计算 | `useMemo`（或交给 React Compiler） |
| 稳定函数/对象 prop | `useCallback`/`useMemo`（或编译器） |
| 可变值 / DOM 句柄 | `useRef` |
| 转发 DOM ref | ref as prop（19），不用 `forwardRef` |
| 跨层传值 | `<Context value>` + `useContext` 或 `use` |
| 唯一 id | `useId` |
| 表单异步提交 | `useActionState` + `useFormStatus` |
| 乐观更新 | `useOptimistic` |
| 外部 store 订阅 | `useSyncExternalStore` |
| 低优先级更新 / 输入防抖 | 见 [concurrent-features.md](concurrent-features.md) |
