# Data Fetching & Caching

> 面向 `next@16`（Cache Components 默认行为）。v16 的缓存模型从 v14/15 的"默认缓存、动态 API opt-out"彻底改为**"默认动态、显式 opt-in 缓存"**——用 `"use cache"` 指令精确控制缓存什么、缓存多久。PPR（部分预渲染）让静态壳瞬间送达、动态内容流式注入。

为什么换模型：旧模型里"页面是静态还是动态"取决于用了哪些 API（`cookies`/`headers`/`searchParams`），调试要理解三层隐式缓存（fetch cache / full-route cache / router cache）。新模型一句话——**没写 `use cache` 就不缓存**。

## 1. 开启 Cache Components

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,   // 统一控制 PPR + use cache + 动态 IO
} satisfies NextConfig

export default nextConfig
```

开启后：
- 所有路由**默认动态渲染**（每请求取最新数据）
- 用 `"use cache"` 选择性缓存
- PPR 成为默认行为（`experimental.ppr` 已移除）
- 旧的 `experimental.useCache` / `experimental.dynamicIO` 被取代
- 路由段配置 `dynamic` / `revalidate` / `fetchCache` 会**报错**，需迁移

> Cache Components 要求 Node.js runtime（`runtime: 'edge'` 已废弃）。

## 2. Server Components 里取数据

Server Component 是 `async` 函数，直接 `await` 数据源：

```tsx
// app/users/page.tsx
import { db } from '@/lib/db'

export default async function UsersPage() {
  const users = await db.query('SELECT * FROM users')   // 默认每请求都跑
  return (
    <ul>
      {users.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  )
}
```

`fetch` 同样默认不缓存（v15 起 `fetch` 不再默认 `force-cache`）。

## 3. `use cache` 指令（核心）

缓存 async 函数/组件的返回值。两层级：

### 数据级缓存

```ts
// app/lib/data.ts
import { cacheLife } from 'next/cache'

export async function getUsers() {
  'use cache'
  cacheLife('hours')          // 缓存 1 小时
  return db.query('SELECT * FROM users')
}
```

### UI 级缓存

```tsx
// app/page.tsx
import { cacheLife } from 'next/cache'

export default async function Page() {
  'use cache'
  cacheLife('hours')
  const users = await db.query('SELECT * FROM users')
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

文件顶部加 `'use cache'` → 该文件所有导出的 async 函数都被缓存。

> **每个 `use cache` 都应配 `cacheLife`**。不配则用隐式 `default` profile。参数和闭包值自动成为缓存键——不同输入产生不同缓存项。参数必须可序列化。

## 4. `cacheLife`（缓存寿命 profile）

```ts
import { cacheLife } from 'next/cache'

async function getProducts() {
  'use cache'
  cacheLife('hours')      // 预设 profile
  // cacheLife({ revalidate: 3600, stale: 3600 })  // 自定义
}
```

预设 profile（在 `next.config.ts` 的 `cacheLife` 里可自定义/扩展）：`default`、`seconds`、`minutes`、`hours`、`days`、`weeks`、`max`。每个 profile 有 `revalidate`（多久重算）和 `stale`（多久内当新鲜的）两个维度。

## 5. `cacheTag`（标签化失效）

给缓存打标签，按需失效：

```tsx
import { cacheLife, cacheTag } from 'next/cache'

async function getPosts() {
  'use cache'
  cacheLife('hours')
  cacheTag('posts')         // 打标签
  const res = await fetch('https://api.vercel.app/blog')
  return res.json()
}
```

失效（通常在 Server Action 里调，见 [server-actions](server-actions.md)）：

```ts
import { revalidateTag } from 'next/cache'

export async function publishPost() {
  'use server'
  await createPost()
  revalidateTag('posts')    // 失效所有带 'posts' 标签的缓存
}
```

## 6. PPR：静态壳 + 动态流式

一个路由同时有静态、缓存、动态三部分。构建时生成静态壳（HTML + RSC Payload），动态部分用 `<Suspense>` 在请求时流式注入：

```tsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheLife, cacheTag } from 'next/cache'

export default function BlogPage() {
  return (
    <>
      {/* 静态：构建时预渲染，进静态壳 */}
      <header><h1>Our Blog</h1></header>

      {/* 缓存：use cache，进静态壳 */}
      <BlogPosts />

      {/* 运行时动态：cookies 每请求不同，流式注入 */}
      <Suspense fallback={<p>Loading your preferences...</p>}>
        <UserPreferences />
      </Suspense>
    </>
  )
}

async function BlogPosts() {
  'use cache'
  cacheLife('hours')
  cacheTag('posts')
  const posts = await fetch('https://api.vercel.app/blog').then(r => r.json())
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}

async function UserPreferences() {
  const theme = (await cookies()).get('theme')?.value || 'light'
  return <aside><p>Your theme: {theme}</p></aside>
}
```

构建时：header（静态）+ BlogPosts（缓存）+ fallback `<p>Loading...</p>` 进静态壳。请求时：UserPreferences 流式注入。

> 关键：读 `cookies()` 不会把整条路由变动态（旧模型会）。Suspense 边界隔离了运行时访问，静态和缓存内容仍随首屏 HTML 发出。

## 7. 流式未缓存数据

不缓存、需每请求取最新的 async 数据，用 `<Suspense>` 包裹：

```tsx
import { Suspense } from 'react'

async function LatestPosts() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}

export default function Page() {
  return (
    <>
      <h1>My Blog</h1>
      <Suspense fallback={<p>Loading posts...</p>}>
        <LatestPosts />
      </Suspense>
    </>
  )
}
```

> 不加 `<Suspense>` 包裹未缓存的 async 读，dev 会报 **blocking-route** insight：`<Suspense fallback={...}><DataChild /></Suspense>`。
> `<Suspense>` 提供回退 UI 但**不会**把同步组件变动态——同步工作仍会在预渲染时完成。

## 8. 随机值与时间戳

`Math.random()` / `Date.now()` / `crypto.randomUUID()` 每次不同，Cache Components 要求显式处理：

**每请求唯一值**：调 `connection()` 推迟到请求时 + `<Suspense>`：

```tsx
import { connection } from 'next/server'
import { Suspense } from 'react'

async function UniqueContent() {
  await connection()              // 标记为请求时执行
  const uuid = crypto.randomUUID()
  return <p>Request ID: {uuid}</p>
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UniqueContent />
    </Suspense>
  )
}
```

**跨用户共享缓存值**：用 `use cache`：

```tsx
export default async function Page() {
  'use cache'
  const buildId = crypto.randomUUID()   // 缓存后所有用户看到同一个值
  return <p>Build ID: {buildId}</p>
}
```

## 9. 传运行时值给缓存函数

从运行时 API 取出值，作为参数传给缓存函数（值成为缓存键）：

```tsx
import { cookies } from 'next/headers'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  )
}

// 不缓存：读运行时数据
async function ProfileContent() {
  const session = (await cookies()).get('session')?.value
  return <CachedContent sessionId={session} />
}

// 缓存：接收提取的值作为 prop
async function CachedContent({ sessionId }: { sessionId: string }) {
  'use cache'
  const data = await fetchUserData(sessionId)
  return <div>{data}</div>
}
```

> 被 `sessionId` 门控的 `<CachedContent>` 不进静态壳。运行时默认内存缓存（serverless 不跨请求持久），要持久共享缓存用 `'use cache: remote'`。
> 运行时预取能在客户端导航时用真实 session 预渲染 `<CachedContent />`，点击前就备好结果。

## 10. `'use cache: private'`（运行时依赖的缓存）

读取 `cookies`/`headers`/`searchParams` 的函数也能给缓存寿命，纳入预取：

```tsx
async function UserGreeting() {
  'use cache: private'
  cacheLife('minutes')
  const theme = (await cookies()).get('theme')?.value || 'light'
  return <p>Your theme: {theme}</p>
}
```

## 11. ISR（增量静态再生成）

`generateStaticParams` 预生成已知参数，未知参数用 ISR：首次访问服务 App Shell，后台升级为完整页面。详见 [ISR with Cache Components](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components)。

```tsx
export async function generateStaticParams() {
  const products = await getProducts()
  return products.map(p => ({ id: p.id }))
}
```

## 12. `after()`（响应后执行）

请求响应发送后跑后台任务（日志、分析、缓存失效），不阻塞 TTFB：

```ts
import { after } from 'next/server'

export default async function Page() {
  const data = await getData()
  after(() => {
    analytics.track('page_view', { url: '/blog' })
  })
  return <Content data={data} />
}
```

## 13. 缓存模型对照（v14/15 → v16）

| 维度 | v14/15（旧） | v16（Cache Components） |
|------|-------------|----------------------|
| 默认 | 静态优先，动态 API opt-out | 动态优先，`use cache` opt-in |
| `fetch` | 默认 `force-cache` | 默认不缓存 |
| 路由段 `revalidate`/`dynamic`/`fetchCache` | 有效 | 报错，迁移到 `use cache` |
| `unstable_cache` | 有效 | 被 `use cache` 取代 |
| PPR | `experimental.ppr` | 默认行为 |
| 整路由因 `cookies()` 变动态 | 是 | 否，Suspense 隔离 |

## 14. 与本仓库其他 skill 的衔接

- 路由与文件约定见 [app-router](app-router.md)。
- 数据变更后失效缓存见 [server-actions](server-actions.md)（`revalidateTag`/`revalidatePath`）。
- Server/Client 取数边界见 [rsc-patterns](rsc-patterns.md)（`use` API 流式传数据给 Client）。
- 客户端取数（带缓存/去重/乐观更新）见 [../tanstack/references/query.md](../tanstack/references/query.md)，与 Server Component 取数互补。
- URL 状态（searchParams）见 [../nuqs/SKILL.md](../nuqs/SKILL.md)。
- 数据校验见 [../data-and-forms/references/zod.md](../data-and-forms/references/zod.md)。

## 15. 坑

| 坑 | 说明 |
|----|------|
| 路由段 `export const revalidate = 60` 报错 | Cache Components 下这些配置被禁；改 `use cache` + `cacheLife` |
| `experimental.ppr` 不识别 | v16 移除，PPR 是默认行为 |
| 未缓存 async 没包 Suspense | dev 报 blocking-route insight；用 `<Suspense>` 包裹 |
| `Math.random()` / `Date.now()` 预渲染失败 | 用 `connection()` + Suspense 每请求生成，或 `use cache` 共享 |
| 缓存了不该缓存的数据（用户特定） | 不要 `use cache` 用户数据；用 `use cache: private` 或 Suspense 流式 |
| `revalidateTag` 不生效 | 确认 `cacheTag` 标签名一致；Server Action 里调 |
| serverless 下缓存丢失 | 默认内存缓存不跨请求；用 `'use cache: remote'` 持久化 |
| 整页变慢（没缓存） | 给稳定数据加 `use cache` + `cacheLife`，进静态壳 |
| `cookies()` 让整页变动态 | v16 不会；用 Suspense 隔离运行时访问 |
