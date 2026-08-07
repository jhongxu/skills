# Concurrent Features

> 面向 React 19.2+。并发渲染让 React 能中断、暂停、恢复渲染，从而在重渲染时保持 UI 响应。本篇讲实际要用的 API：`startTransition` / `useTransition` / `useDeferredValue` / `Suspense` / `use` / `<Activity>`。

## 1. 自动批处理（19 默认开启）

React 18 起，**任何上下文**里的多次 `setState` 都会批处理为一次渲染：

```tsx
function Page() {
  const [a, setA] = useState(0)
  const [b, setB] = useState(0)

  const onClick = async () => {
    await fetch('/api')
    setA(1)   // ┐
    setB(2)   // ┘ 一次渲染（19 默认，无需 ReactDOM.unstable_batchedUpdates）
  }
}
```

无需任何 API，直接受益。

## 2. `useTransition` — 把更新标为低优先级

```tsx
function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [isPending, startTransition] = useTransition()

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)                    // 紧急：输入立即响应
    startTransition(() => {
      setResults(filter(results, e.target.value)) // 非紧急：可被打断
    })
  }

  return (
    <>
      <input value={query} onChange={onChange} />
      {isPending && <Spinner />}
      <ResultList results={results} />
    </>
  )
}
```

要点：
- **紧急更新**（输入框文字、点击反馈）直接 `setState`。
- **非紧急更新**（大列表过滤、图表重算、tab 切换后内容）放进 `startTransition`。
- `isPending` 用于显示过渡态（dim/骨架）。
- transition 里可以放 async 函数（Actions 就是这么实现的，见 [core-hooks.md](core-hooks.md)）。

### 何时**别**用 transition

- `input`/`textarea` 受控值本身（会引入输入延迟）。
- 真正同步的轻量更新（过滤 10 条数据不需要）。

## 3. `useDeferredValue` — 延迟「来自上层的值」

当无法控制设值（值来自 props 或 store），用 `useDeferredValue` 在子树层面延迟：

```tsx
function ExpensiveList({ items }: { items: Item[] }) {
  const deferredItems = useDeferredValue(items)
  const stale = items !== deferredItems   // 是否正在用旧值渲染

  return (
    <ul style={{ opacity: stale ? 0.6 : 1 }}>
      {deferredItems.map(i => <li key={i.id}>{i.name}</li>)}
    </ul>
  )
}
```

`useTransition` 是「我能控制设值」；`useDeferredValue` 是「我只能控制读值」。二选一，别叠加。

## 4. Suspense — 声明式加载态

任意子树 suspend（抛 Promise）时，最近的 `<Suspense>` 显示 fallback：

```tsx
<Suspense fallback={<Skeleton />}>
  <Profile id={1} />
</Suspense>
```

### 嵌套边界 = 流式渐进披露

```tsx
<Suspense fallback={<PageSkeleton />}>
  <Header />
  <Suspense fallback={<MainSkeleton />}>
    <Main />          {/* 先露出 header，main 好了再露 */}
  </Suspense>
  <Suspense fallback={<CommentsSkeleton />}>
    <Comments />      {/* 最后露出，互不阻塞 */}
  </Suspense>
</Suspense>
```

每个边界独立 resolve，可用 CSS transition 做交叉淡入。19.2 起 React DOM 会**批量揭示**同一帧内多个 suspense 解析，避免逐个闪烁。

### 已 stable 的可 suspend 资源

- `React.lazy()` 动态 import 组件
- `use(promise)`（见下）
- 框架数据加载（Next.js `fetch`、TanStack Query suspense 模式）
- 19 起的资源加载（`<link>`/`<style>`/`<script>`/`<img>`/`<pre>`，通过 `preload`/`precedence`）

## 5. `use(promise)` — 渲染期读 Promise

```tsx
import { use, Suspense } from 'react'

function Profile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise)   // suspend 直到 resolve
  return <h1>{user.name}</h1>
}

export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <Profile userPromise={fetchUser()} />
    </Suspense>
  )
}
```

### 规则一：Promise 必须稳定（最常踩的坑）

```tsx
// ❌ 无限循环：每次渲染新建 Promise → use suspend → 重渲染 → 新 Promise → ...
function Profile({ id }: { id: string }) {
  const user = use(fetchUser(id))   // fetchUser 每次返回新 Promise
  return <h1>{user.name}</h1>
}

// ✅ Promise 来自父组件或缓存
function Profile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise)
  return <h1>{user.name}</h1>
}
```

`fetchUser(id)` 这种「每次新 Promise」的不能用 `use` 直连，要么：
- 在 Server Component 里 `await` 或 `cache(fetchUser)` 后把 Promise 传给 client 子组件（推荐，见 [server-components.md](server-components.md)）；
- 在 client 用 `useMemo` 缓存 Promise（`useMemo(() => fetchUser(id), [id])`）；
- 或者用 TanStack Query（见 [../tanstack/references/query.md](../../tanstack/references/query.md)），它管缓存与去重。

### 规则二：reject 走错误边界

`use(promise)` reject 时，错误抛给最近的错误边界，**没有局部 `error` state**：

```tsx
<ErrorBoundary fallback={(e, reset) => <ErrorView error={e} onRetry={reset} />}>
  <Suspense fallback={<Spinner />}>
    <Profile userPromise={p} />
  </Suspense>
</ErrorBoundary>
```

> 边界越细，故障越局部。多个独立数据源别共用一个边界，否则一处失败整片卸载。错误边界写法见 [component-patterns.md](component-patterns.md)。

### 规则三：不能在 try/catch 里调用

```tsx
// ❌
try {
  const user = use(p)
} catch (e) { /* 永远抓不到 */ }
```

错误用错误边界接。

### 并行获取：多个 `use` 顶层并列

```tsx
function Page({ userP, postsP }: { userP: Promise<User>; postsP: Promise<Post[]> }) {
  const user = use(userP)
  const posts = use(postsP)   // 两个 Promise 并行发起，顺序读
  return <Main user={user} posts={posts} />
}
```

注意：若两个 Promise 真独立，**父组件要并行创建**（`Promise.all` 或分别缓存），别在子组件里串行。

### `use` 也可读 context（可条件调用）

见 [core-hooks.md](core-hooks.md) 的 Context 段——`use(Context)` 可放在 `if` 里，`useContext` 不行。

## 6. `<Activity>` — 隐藏而非卸载（19.2 稳定）

切 tab 时想保住另一个 tab 的滚动位置与 state，旧办法是 `display:none` + CSS hack 或条件渲染丢状态。19.2 用 `<Activity>`：

```tsx
import { Activity } from 'react'

function App({ tab }: { tab: 'a' | 'b' }) {
  return (
    <>
      <Activity mode={tab === 'a' ? 'visible' : 'hidden'}>
        <PanelA />
      </Activity>
      <Activity mode={tab === 'b' ? 'visible' : 'hidden'}>
        <PanelB />
      </Activity>
    </>
  )
}
```

行为（官方）：
- `hidden` 时 React 用 `display: none` 隐藏 DOM，**销毁 Effect**（清理订阅），但**保留 state 与 DOM 节点**。
- `visible` 时恢复 Effect 与可见性，state 如旧。
- 隐藏期间仍会以低优先级响应 props 变更。

> 只有一个 `mode` 必须是 `visible`，其余 `hidden`。不要把所有都设 `hidden`（至少保留当前页可见）。

适合：多 tab、抽屉/侧栏暂存、预渲染即将出现的内容。**不适合**需要彻底卸载清理的场景——隐藏期 Effect 不跑，定时器/订阅会被清掉。

## 7. 优先级 Lane（概念，无需手控）

React 内部用 lane 模型给更新分级，大致映射：

| Lane | 用途 |
|------|------|
| Sync | 同步强制更新（`flushSync` 内） |
| InputContinuous | 拖拽、滚动等连续输入 |
| Default | 普通setState |
| Transition | `startTransition` 标记的 |
| Idle | 预取、空闲任务 |

业务代码不直接操作 lane，理解即可：transition 走 TransitionLane，可被 Sync/InputContinuous 打断。

## 8. 流式 SSR 与 Selective Hydration

并发 SSR（`renderToPipeableStream` / `renderToReadableStream`）配合 Suspense 实现：
- **流式 HTML**：先发骨架，数据好了再流式补发对应 Suspense 块。
- **选择性水合**：某块 HTML 还在流式传输时，已就绪的交互岛可以先水合并响应点击（点击会提升该块优先级插队水合）。

框架（Next.js）已默认启用，业务层只需正确放 Suspense 边界。

## 速查

| 需求 | API |
|------|-----|
| 大列表过滤不卡输入 | `useTransition` |
| 上层 props 值太频繁 | `useDeferredValue` |
| 异步加载态 | `<Suspense fallback>` |
| 渲染期读 Promise | `use(p)`（Promise 需稳定缓存） |
| Promise 失败处理 | Error Boundary（无局部 error state） |
| 切 tab 保留 state | `<Activity mode>`（19.2） |
| 表单异步提交 | `useActionState` + transition（见 [core-hooks.md](core-hooks.md)） |
| 多个独立加载态 | 多个嵌套 `<Suspense>`，别共用边界 |
