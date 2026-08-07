# RSC Patterns

> 面向 `next@16` + React 19。App Router 默认所有组件是 Server Component（零客户端 JS），需要交互的才标 `'use client'` 划出 client 边界。理解两套模块图的协作是写好 Next.js 应用的核心。

为什么 Server Components：数据靠近源头取（DB/API）、密钥不暴露给浏览器、减少客户端 JS、改善 FCP 并流式推送。Client Components 负责：状态、事件处理、生命周期、浏览器 API。

## 1. Server vs Client：何时用哪个

**Server Component**（默认）用于：
- 从 DB / API 取数据
- 用密钥/token 等敏感信息（不进客户端 bundle）
- 减少 JS 体积、改善首屏

**Client Component**（`'use client'`）用于：
- 状态（`useState`）与事件处理（`onClick`、`onChange`）
- 生命周期（`useEffect`）
- 浏览器 API（`localStorage`、`window`、`geolocation`）
- 自定义 hooks（用上述能力的）

```tsx
// app/page.tsx —— Server Component，默认
import { getPost } from '@/lib/data'
import LikeButton from '@/app/ui/like-button'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)
  return (
    <main>
      <h1>{post.title}</h1>
      <LikeButton likes={post.likes} />   {/* Client Component */}
    </main>
  )
}
```

```tsx
// app/ui/like-button.tsx
'use client'

import { useState } from 'react'

export default function LikeButton({ likes }: { likes: number }) {
  const [count, setCount] = useState(likes)
  return <button onClick={() => setCount(c => c + 1)}>❤️ {count}</button>
}
```

## 2. 渲染流程

**服务端**：每个路由段（layout/page）拆成 chunk 并行渲染。
- Server Components → RSC Payload（二进制 React 树表示）
- Client Components + RSC Payload → 预渲染 HTML

**客户端首屏**：HTML 立即展示 → RSC Payload 协调两棵树 → JS hydrate Client Components 使其可交互。

**后续导航**：RSC Payload 预取缓存实现即时导航；Client Components 完全在客户端渲染（无服务端 HTML）。

## 3. `'use client'` 边界语义

`'use client'` 标记**模块图边界**：该文件及其直接 import 的所有模块都进客户端 bundle。不需要给每个客户端组件加指令——边界组件 import 的都自动进 client。

```tsx
// app/ui/counter.tsx
'use client'

import { useState } from 'react'
import { format } from '@/lib/format'   // 自动进客户端 bundle

export default function Counter() {
  const [n, setN] = useState(0)
  return <button onClick={() => setN(n + 1)}>{format(n)}</button>
}
```

**减包**：只给真正交互的组件加 `'use client'`，而非整片 UI。例：Layout 多是静态元素 + 一个搜索框，只给 `<Search />` 加 `'use client'`，Layout 本身仍是 Server Component。

```tsx
// app/layout.tsx —— Server Component
import Search from './search'
import Logo from './logo'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav><Logo /><Search /></nav>
      <main>{children}</main>
    </>
  )
}
```

## 4. Server → Client 传数据

用 props 传。**props 必须可序列化**（不能传函数、Class 实例、Symbol 等）：

```tsx
// app/page.tsx —— Server
import LikeButton from '@/app/ui/like-button'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)
  return <LikeButton likes={post.likes} />   // 传可序列化的值
}
```

### 用 `use` API 流式传数据

把 Promise 作为 prop 传给 Client Component，用 `use()` 解包——数据就绪时才渲染该部分：

```tsx
// app/page.tsx —— Server
import { Suspense } from 'react'
import Cart from './cart'

export default function Page() {
  const cartPromise = getCart()    // 不 await
  return (
    <Suspense fallback={<p>Loading cart…</p>}>
      <Cart cartPromise={cartPromise} />
    </Suspense>
  )
}
```

```tsx
// app/cart.tsx —— Client
'use client'

import { use } from 'react'

export default function Cart({ cartPromise }: { cartPromise: Promise<CartData> }) {
  const cart = use(cartPromise)   // Promise 就绪时解包
  return <div>{cart.items.length} items</div>
}
```

> 这样 Server Component 不必等所有数据就能先发静态壳，Cart 数据流式注入。

## 5. 交错 Server 与 Client（children 模式）

**不能**把 Server Component import 进 Client Component（会变成 client）。但可以把 Server Component 作为 `children`/prop 传给 Client Component——它在服务端渲染，作为已渲染结果传入：

```tsx
// app/ui/modal.tsx —— Client
'use client'

import { useState } from 'react'

export default function Modal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>打开</button>
      {open && <div className="modal">{children}</div>}
    </>
  )
}
```

```tsx
// app/page.tsx —— Server
import Modal from '@/app/ui/modal'
import Cart from '@/app/ui/cart'   // Cart 是 Server Component，取数据

export default async function Page() {
  return (
    <Modal>
      <Cart />          {/* Server Component，服务端渲染后作为 children 传入 */}
    </Modal>
  )
}
```

`<Cart>` 在服务端渲染（能取数据），其渲染结果作为 `children` 传给 `<Modal>`（Client Component 控制显隐）。这是 RSC 最强大的组合模式。

## 6. Context Provider

Server Component 不能用 React Context（`createContext` 只在 Client 生效）。要共享主题、状态，在根布局的 client 包裹层里放 provider：

```tsx
// app/providers.tsx —— Client
'use client'

import { ConfigProvider } from 'antd'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class">
      <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
        {children}
      </ConfigProvider>
    </ThemeProvider>
  )
}
```

```tsx
// app/layout.tsx —— Server
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

> `suppressHydrationWarning`：用 `next-themes` 这类在客户端改 `<html>` class 的库时，避免 hydration 不匹配警告。

## 7. 第三方组件改造

第三方组件没标 `'use client'` 但用了客户端能力时，包一层：

```tsx
// app/ui/acme-widget.tsx
'use client'

import { AcmeWidget } from 'acme-package'   // 假设它用了 useState

export default AcmeWidget
```

或直接在你用的 Client Component 里 import 它（边界自动覆盖）。

## 8. 懒加载 Client Component

`next/dynamic` 懒加载，`ssr: false` 时只在客户端渲染（首屏不参与 SSR）：

```tsx
'use client'

import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('./heavy-chart'), {
  loading: () => <p>加载图表…</p>,
  ssr: false,   // 只在客户端渲染（如依赖 window 的图表库）
})

export function Dashboard() {
  return <HeavyChart data={...} />
}
```

> v15 起移除了 `dynamic` 的 `suspense` prop，App Router 下不再自动插入空 Suspense 边界——要自己包 `<Suspense>`。

## 9. Suspense 与流式

Server Component 取数时用 `<Suspense>` 边界控制流式：

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      <h1>Dashboard</h1>
      <Suspense fallback={<ChartSkeleton />}>
        <Chart />          {/* async Server Component */}
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <Table />
      </Suspense>
    </>
  )
}
```

每个 Suspense 边界独立流式：先发静态壳 + 回退 UI，各数据就绪后逐一替换。这比等所有数据再发首屏快得多。缓存机制见 [data-fetching](data-fetching.md)。

## 10. `use client` 指令规则速查

| 场景 | 做法 |
|------|------|
| 组件用 `useState`/`useEffect`/事件 | 文件顶部 `'use client'` |
| Server Component 取数据 | `async function`，无需指令 |
| Server Component import Client Component | 直接 import，正常用 |
| Client Component import Server Component | ❌ 不行；用 `children` prop 传 |
| Server Component 传函数给 Client | ❌ 不可序列化；改用 Server Action (`'use server'`) |
| Context provider | 在 client 包裹组件里放 |
| 共享 hooks（用 state/effect） | 文件标 `'use client'` |

## 11. 防环境污染

Server Component 可能意外把整个模块图拖进客户端（如某工具函数 import 了 `node:fs`）。检查方式：

```bash
next build           # 看 trace 输出
# 或分析
ANALYZE=true next build
```

把服务端专用逻辑放标了 `'use server'` 的文件，或确保只在 Server Component 里 import。

## 12. 与本仓库其他 skill 的衔接

- 数据获取与缓存见 [data-fetching](data-fetching.md)（`use cache`/PPR/Suspense 流式）。
- 变更与表单提交见 [server-actions](server-actions.md)（`'use server'` 是 RSC 体系的一部分）。
- 路由文件约定见 [app-router](app-router.md)。
- UI 组件库见 [../ui/references/antd-v6.md](../ui/references/antd-v6.md)：antd 组件多为 Client Component，需在 client 边界用。
- React 19 的 `use`/`useOptimistic`/`useActionState` 见 [../react/references/miscellaneous-apis.md](../react/references/miscellaneous-apis.md) 与 [../react/references/streaming-apis.md](../react/references/streaming-apis.md)。
- 客户端状态/取数见 [../tanstack/references/query.md](../tanstack/references/query.md)（在 Client Component 里用）。

## 13. 坑

| 坑 | 说明 |
|----|------|
| ` createContext` 在 Server Component 报错 | Context 只在 client 用；把 provider 放 client 包裹组件 |
| 把 Server Component import 进 Client | 不行；用 `children` prop 模式 |
| props 传函数给 Client Component | 不可序列化；改用 Server Action |
| 整片 UI 变胖 | 只给交互组件加 `'use client'`，静态部分留 Server |
| `next/dynamic` 的 `suspense` prop 报错 | v15 移除；自己包 `<Suspense>` |
| `ssr: false` 在 Server Component 里用 | `dynamic({ ssr: false })` 必须在 Client Component 里调用 |
| hydration 不匹配（主题/class） | 加 `suppressHydrationWarning`，或把差异部分放 client |
| 服务端专用模块进了客户端 bundle | 检查 import 链；把服务端逻辑放 `'use server'` 文件 |
| 取数在 Client Component 里跑（暴露密钥） | 把取数移到 Server Component，结果作 props 传下 |
| Suspense 没流式（同步组件也包了） | 同步组件预渲染时已完成；Suspense 只对 async/运行时访问有意义 |
