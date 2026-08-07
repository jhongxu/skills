# 其他 API（cache / ViewTransition / 资源预加载 / taint / 调试）

> 零散但实战有用的 React 19+ API。版本敏感，以下来自官方文档核对。`<ViewTransition>`/`addTransitionType` 仍 **Canary**，其余已稳定。

## 1. `cache(fn)` — RSC 内的请求级缓存

**仅 Server Components 可用**。把函数包装成缓存版本：相同参数 → 返回缓存结果（同一请求内）。

```tsx
import { cache } from 'react'
import { getUser } from './db'

// ✅ 模块级定义（不在组件内）
const getCachedUser = cache(getUser)

async function Profile({ id }) {
  const user = await getCachedUser(id)   // 多处调用同一 id → 只查一次 DB
  return <div>{user.name}</div>
}
```

### 关键语义

- **请求级**：缓存生命周期 = 单次服务器请求。请求结束后清空。
- **参数等值**：用 `Object.is` 比较。对象/数组需保持同一引用（同 `useMemo` 约束）。
- **不可跨请求**：绝不用于持久缓存。持久缓存用框架机制（Next.js `unstable_cache`/`revalidateTag`）。

### 三个典型用法

#### (a) 缓存昂贵计算

```tsx
const getMetrics = cache((data) => calculateMetrics(data))
```

#### (b) 共享数据快照（去重请求）

```tsx
// 多个组件调用同一 id → DB 只查一次
const getUser = cache(async (id) => db.users.findById(id))

async function Header({ id }) { const u = await getUser(id); return <b>{u.name}</b> }
async function Sidebar({ id }) { const u = await getUser(id); return <i>{u.role}</i> }
// Profile 渲染 Header + Sidebar → getUser 只执行一次
```

#### (c) 预加载

```tsx
const getUser = cache(async (id) => db.users.findById(id))

async function Profile({ id, prefetch }) {
  if (prefetch) {
    await getUser(id)  // 提前预热缓存
  }
  return <Suspense fallback={<Spinner />}><Header id={id} /></Suspense>
}
```

### `cacheSignal`（配套，Canary）

返回一个在请求所有缓存数据 ready 时触发的 `AbortSignal`——用于流式 SSR 时判断"何时可以开始流式输出"。

## 2. `<ViewTransition>` — 视图过渡动画（Canary）

```tsx
import { ViewTransition } from 'react'

<ViewTransition>
  <div>内容</div>
</ViewTransition>
```

让组件树的进入/退出/更新/重排带动画。配合 Suspense、Transition、`startTransition` 使用。

### 触发方式

`<ViewTransition>` 本身不触发动画——需要在 `startTransition` 内 setState 才会激活：

```tsx
function App() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => startTransition(() => setOpen(v => !v))}>
        Toggle
      </button>
      <ViewTransition>
        {open ? <Panel /> : null}
      </ViewTransition>
    </>
  )
}
```

### View Transition Class（CSS 类映射）

```tsx
<ViewTransition
  enter="panel-enter"
  exit="panel-exit"
  update="panel-update"
  layout="panel-layout"
  share="panel-share"
>
  <Panel />
</ViewTransition>
```

对应 CSS：

```css
::view-transition-old(panel-enter) { animation: fade-out 200ms; }
::view-transition-new(panel-enter) { animation: slide-in 300ms; }
```

### 配合 `addTransitionType` 按动因切换动画

```tsx
<ViewTransition enter={{
  'nav-back': 'enter-right',
  'nav-forward': 'enter-left',
}}>
  <Page />
</ViewTransition>

// 触发处
startTransition(() => {
  addTransitionType('nav-back')
  navigate(-1)
})
```

### Caveats

- **Canary**：仅 `react@canary`/`experimental`，未稳定，API 可能变
- 依赖浏览器 [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- 与 StyleX 集成：StyleX v0.18+ 提供 `stylex.viewTransitionClass()`。见 [../stylex/references/api-reference.md](../stylex/references/api-reference.md)。

## 3. `addTransitionType` — 标记 transition 动因（Canary）

```tsx
import { startTransition, addTransitionType } from 'react'

startTransition(() => {
  addTransitionType('submit-click')
  action()
})
```

给 transition 打字符串标签。多标签可叠加，每次 commit 后清空。配合 `<ViewTransition>` 实现按动因的差异化动画（见上节）。

> 未来用途会扩展（如分析、按动因优化），目前主要用于 ViewTransition。

## 4. 资源预加载 API

`react-dom` 提供一组在渲染或事件中预加载资源的函数：

| API | 作用 |
|-----|------|
| `preload(href, { as })` | 预获取资源（font/script/style/image…），**仅下载不执行** |
| `preinit(href, { as })` | 预初始化：下载**并执行**（如 script）/ 应用（如 stylesheet） |
| `preloadModule(href, options)` | 预加载 ESM 模块（仅下载） |
| `preinitModule(href, options)` | 预初始化 ESM 模块（下载并执行） |
| `preconnect(href, options)` | 预连接（DNS+TCP+TLS 提前建立） |
| `prefetchDNS(href)` | 预解析 DNS |

### 渲染时预加载

```tsx
import { preload } from 'react-dom'

function AppRoot() {
  preload('https://example.com/font.woff2', { as: 'font' })
  preload('https://example.com/hero.webp', {
    as: 'image',
    imageSrcSet: 'hero-1x.webp 1x, hero-2x.webp 2x',
    imageSizes: '100vw',
    fetchPriority: 'high',
  })
  return <main>…</main>
}
```

### 事件处理中预加载（hover/click 提前加载下一页资源）

```tsx
import { preload } from 'react-dom'

function CallToAction() {
  return (
    <button onClick={() => {
      preload('https://example.com/wizard.css', { as: 'style' })
      startWizard()
    }}>
      Start Wizard
    </button>
  )
}
```

### 选项（`preload`）

| 选项 | 说明 |
|------|------|
| `as`（必填） | `audio`/`document`/`embed`/`fetch`/`font`/`image`/`object`/`script`/`style`/`track`/`video`/`worker` |
| `crossOrigin` | `anonymous`/`use-credentials`（`as: 'fetch'` 时必填） |
| `referrerPolicy` | `no-referrer-when-downgrade`（默认）等 |
| `integrity` | SRI 哈希 |
| `type` | MIME 类型 |
| `nonce` | CSP nonce |
| `fetchPriority` | `auto`/`high`/`low` |
| `imageSrcSet` / `imageSizes` | 仅 `as: 'image'` |

### SSR 注意

- SSR 中只有在**渲染组件时**或**源自渲染的 async context** 中调用才生效
- 等价调用会去重（同 `href` + 同 `as`/`imageSrcSet`/`imageSizes` 视为一次）
- 框架（Next.js）通常自动处理资源加载，**业务代码少直接调**

## 5. `captureOwnerStack()` — 开发期错误堆栈（Dev only）

返回当前 **Owner Stack**（创建当前节点的组件链路）作为字符串，用于自定义错误覆盖层。

```tsx
import * as React from 'react'

const originalConsoleError = console.error
console.error = function patched(...args) {
  originalConsoleError.apply(console, args)
  if (process.env.NODE_ENV !== 'production') {
    const ownerStack = React.captureOwnerStack()
    onConsoleError({ message: args[0], ownerStack })
  }
}
```

### Owner Stack vs Component Stack

- **Component Stack**（`errorInfo.componentStack`）：从抛错组件向上到根，含 DOM 节点（`at fieldset`）
- **Owner Stack**：只含"创建抛错节点的组件"，DOM 节点与转发 `children` 的父组件不在内——更精准定位责任方

```
// Component Stack
at SubComponent
at fieldset
at Component
at main
at Suspense
at App

// Owner Stack（仅 Component——它创建了 <SubComponent/>）
at Component
```

### 注意

- **仅开发环境**：生产构建中始终返回 `null`（且 `captureOwnerStack` 在生产为 `undefined`）
- 用 **namespace import**（`import * as React`）而非 named import，避免生产构建打包失败
- 可用位置：组件 render、Effect、React 事件处理器、React 错误处理器（`onCaughtError`/`onRecoverableError`/`onUncaughtError`）
- 在 `setTimeout`/`fetch` 回调或自定义 DOM 事件处理器中调用会返回 `null`——需在 Effect 体里先抓

## 6. `experimental_taintObjectReference` / `experimental_taintUniqueValue`（安全，实验）

防止敏感数据从 Server Components 泄漏到 Client Components：

```tsx
import { experimental_taintObjectReference, experimental_taintUniqueValue } from 'react'

async function getUser(id) {
  const user = await db.users.findById(id)
  // 标记整个对象：禁止传给 Client
  experimental_taintObjectReference('Do not pass user to client', user)
  // 标记单个敏感字段：禁止传该值
  experimental_taintUniqueValue('Do not pass token to client', user, user.token)
  return user
}
```

若误把 tainted 对象/值传给 Client Component（如作为 props），React 会抛错。这是 RSC 的纵深防御层——**实验性，API 可能变**。

## 7. `act` — 测试辅助

`act` 让你测试时确保所有 React 更新（含异步）在断言前完成。详见 [../testing/references/vitest-react.md](../testing/references/vitest-react.md)。

## 8. 速查

| 需求 | API |
|------|-----|
| RSC 内去重 DB 查询 | `cache(fn)`（请求级，模块级定义） |
| RSC 内缓存昂贵计算 | `cache(fn)` |
| 预热 RSC 缓存 | 提前 `await cachedFn(args)` |
| 视图过渡动画（Canary） | `<ViewTransition>` + `startTransition` |
| 按动因切动画 | `addTransitionType` + View Transition Class 映射 |
| 预下载资源 | `preload(href, { as })` |
| 预下载并执行/应用 | `preinit(href, { as })` |
| 预连接 | `preconnect` / `prefetchDNS` |
| 自定义错误覆盖层堆栈 | `captureOwnerStack()`（dev，namespace import） |
| 防敏感数据泄漏 RSC→Client | `experimental_taintObjectReference`/`taintUniqueValue`（实验） |
| 测试同步更新 | `act`（见 testing） |
