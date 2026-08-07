# TanStack Router

> 面向 `@tanstack/react-router@1.169+`（2026-05）。全类型推断的客户端路由：文件路由 + 类型安全的 params/search/loader。版本敏感，写之前以官方文档为准。SSR/全栈场景看 TanStack Start，本篇覆盖 SPA 路由核心。

## 1. 安装与 Vite 配置

```bash
pnpm add @tanstack/react-router
pnpm add -D @tanstack/router-plugin @tanstack/router-devtools
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }), // ✅ 必须在 react() 之前
    react(),
  ],
})
```

要点：
- 插件顺序——`tanstackRouter()` 必须在 `react()` 之前，否则 `routeTree.gen.ts` 不更新。
- `autoCodeSplitting: true` 按路由自动拆包，2026 推荐开启。
- 要求 Node `>=20.19`、TypeScript `>=5.3`（strict 强烈推荐，否则推断打折）。

## 2. 创建 Router + Register（必须）

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen' // 插件自动生成，勿手改

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',          // hover/focus 时预加载
  defaultPreloadStaleTime: 0,        // 把缓存新鲜度交给 TanStack Query
  scrollRestoration: true,
})

// ⚠️ 非可选：注册 router 类型，否则 <Link>/useNavigate/Route hooks 退化成 string
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

**漏掉 `Register` 增强是最常见坑**——`to=`、`search=`、`useSearch()` 全部失去类型推断，退回 `string` / `unknown`。

## 3. 文件路由约定

插件监听 `src/routes/`，生成 `routeTree.gen.ts`。命名规则：

| 文件 | 匹配路径 | 说明 |
|------|----------|------|
| `__root.tsx` | — | 根路由，无 path，永远渲染；放 layout |
| `index.tsx` | `/` | 首页 |
| `about.tsx` | `/about` | 基础路由 |
| `posts.tsx` | `/posts` | `/posts/*` 的 layout 父路由 |
| `posts/index.tsx` | `/posts/` | `/posts` 精确匹配时的 index |
| `posts/$postId.tsx` | `/posts/:postId` | 动态段 |
| `posts/$postId.edit.tsx` | `/posts/:postId/edit` | 动态段 + 静态后缀 |
| `posts_.$postId.tsx` | `/posts/:postId` | 不布局（`_` 拼接，跳过父 layout） |
| `file.$` | `/file/$` | 转义字面量 `$` |

父路由组件里用 `<Outlet />` 渲染子路由。

## 4. 定义路由

### 根路由

```tsx
// src/routes/__root.tsx
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import type { QueryClient } from '@tanstack/react-query'

export interface RouterContext {
  queryClient: QueryClient
  auth: { user: User | null }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <nav>
        <Link to="/" activeProps={{ className: 'font-bold' }}>首页</Link>
        <Link to="/posts" activeProps={{ className: 'font-bold' }}>文章</Link>
      </nav>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  )
}
```

用 `createRootRouteWithContext<T>()` 而非 `createRootRoute()`，方便注入 `queryClient`/`auth` 等依赖（见 [query.md](query.md) 的集成段）。

### 普通路由

```tsx
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  // path 字符串由插件自动写入/维护，不用手改
  loader: async ({ params }) => fetchPost(params.postId),
  component: PostComponent,
})

function PostComponent() {
  const post = Route.useLoaderData()      // 类型推断为 Post
  const { postId } = Route.useParams()    // { postId: string }
  return <article><h1>{post.title}</h1><p>{post.body}</p></article>
}
```

`createFileRoute('/path')` 的 path 参数是给 TS 推断用的——插件会自动同步，**别手改**。

## 5. 动态段与 params

`$name` 捕获单段，`$` 捕获多段 splat：

```tsx
// src/routes/files/$.tsx → /files/*
function Files() {
  const { '*': splat } = Route.useParams()   // /files/a/b/c → 'a/b/c'
}
```

需要把 `postId: string` 转成数字，用 `params` 选项（不要在组件里 `Number()` 转换，会丢类型安全）：

```tsx
export const Route = createFileRoute('/posts/$postId')({
  params: {
    parse: ({ postId }) => ({ postId: Number(postId) }),
    stringify: ({ postId }) => ({ postId: String(postId) }),
  },
  // ...
})
```

## 6. Search params —— 带 schema 的 URL 状态

URL search 不再是 `string | null` 手拼，而是经 schema 校验的强类型状态。

### 用 Zod 适配器

```bash
pnpm add @tanstack/zod-adapter zod
```

```tsx
// src/routes/posts/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'

const searchSchema = z.object({
  page: z.number().int().min(1).default(1),
  sort: z.enum(['new', 'top']).default('new'),
  tag: z.string().optional(),
})

export const Route = createFileRoute('/posts/')({
  validateSearch: zodValidator(searchSchema),
  component: PostsList,
})

function PostsList() {
  const { page, sort } = Route.useSearch()   // { page: number; sort: 'new'|'top'; tag?: string }
  // ...
}
```

> **Zod 4 注意**：`@tanstack/zod-adapter@1.167` 与 Zod 4 不兼容（peerDep 锁 zod@3）。Zod 4 项目可不用适配器，直接传 `validateSearch` 自定义函数，或锁 zod@3。Zod 本身见 [../data-and-forms/references/zod.md](../../data-and-forms/references/zod.md)。

### search middlewares：跨导航保留/清除参数

```tsx
import { retainSearchParams, stripSearchParams } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/')({
  // 离开时保留 page，丢掉 tag
  middleware: [retainSearchParams(['page']), stripSearchParams(['tag'])],
  // ...
})
```

### 类型安全地更新 search

```tsx
const navigate = useNavigate({ from: '/posts' })
navigate({ search: prev => ({ ...prev, page: prev.page + 1 }) })  // 函数式更新，类型安全
```

## 7. loader vs beforeLoad

两个都「组件渲染前」跑，但语义不同：

| | `beforeLoad` | `loader` |
|---|---|---|
| 执行顺序 | **串行**（父→子） | **并行**（所有匹配路由同时） |
| 用途 | 鉴权、context 累积、重定向 | 取数 |
| 返回值 | 并入 router context（子路由可读） | 作为 loader data（仅本路由） |
| redirect | `throw redirect({ to })` | 一般不在这重定向 |

### beforeLoad：鉴权 + context 累积

```tsx
// src/routes/dashboard.tsx
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context, location }) => {
    const user = context.auth.user
    if (!user) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { user }   // 子路由通过 context.user 读到
  },
})

// src/routes/dashboard/admin.tsx
export const Route = createFileRoute('/dashboard/admin')({
  beforeLoad: ({ context }) => {
    if (!context.user.isAdmin) throw redirect({ to: '/dashboard' })
  },
  // ...
})
```

抛 `redirect` 会中断后续 beforeLoad 与 loader；`isRedirect` 错误由 router 识别处理，不会冒泡成未捕获异常。

### loader：取数（组件渲染前）

```tsx
export const Route = createFileRoute('/posts')({
  loader: async ({ params }) => fetchPosts(),
  pendingComponent: () => <Spinner />,   // loader 进行中
  errorComponent: ({ error }) => <ErrorView error={error} />,
  component: Posts,
})
```

v1.169 新增 `loader.staleReloadMode`：`'background'`（默认，后台刷新不阻塞）或 `'blocking'`（重新进入时阻塞等最新），取代旧的单 `staleTime` 行为。

## 8. 导航

### `<Link>` —— 类型安全

```tsx
<Link to="/posts/$postId" params={{ postId: 123 }} search={{ sort: 'top' }}>
  文章
</Link>
```

`to` / `params` / `search` 全部按 route tree 推断：拼错路径、漏 params、search 字段类型不符都会编译报错。

### `useNavigate` —— 命令式

```tsx
const navigate = useNavigate({ from: '/posts' })
await navigate({ search: { page: 2 } })   // 返回 Promise，导航完成 resolve
```

`from` 固定来源路由，让 `search` 更新按该路由 schema 校验。

### `redirect` —— beforeLoad 里抛

```tsx
import { redirect } from '@tanstack/react-router'
throw redirect({ to: '/login', search: { redirect: location.href } })
```

## 9. 预加载

```ts
createRouter({
  routeTree,
  defaultPreload: 'intent',          // hover/focus 预取
  defaultPreloadStaleTime: 0,        // 0 = 永远视为 stale，把新鲜度交给 Query
})
```

| 值 | 触发时机 |
|----|----------|
| `'intent'` | hover / focus（默认推荐） |
| `'viewport'` | 进入视口 |
| `'render'` | 渲染即预取 |
| `false` | 关闭 |

配合 TanStack Query 时设 `defaultPreloadStaleTime: 0`，让 router 只触发预取、缓存新鲜度完全由 Query 管——避免双缓存冲突。

## 10. 与 TanStack Query 集成（推荐模式）

router 当**协调器**，Query 当**缓存层**：

```tsx
// src/routes/posts.tsx
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

const postsQuery = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

export const Route = createFileRoute('/posts')({
  // loader 只保证缓存有数据，无 loading 闪烁、无组件取数瀑布
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  component: Posts,
})

function Posts() {
  const { data: posts } = useSuspenseQuery(postsQuery)   // 同步读，必命中
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

为什么走 loader + `ensureQueryData` 而不是组件里直接 `useQuery`：
- 无 loading 闪烁（数据就绪才渲染）
- 无组件取数瀑布（loader 并行）
- 预加载时 Query 缓存被预热

Query 细节见 [query.md](query.md)。

## 11. 速查：常见坑

| 症状 | 原因 |
|------|------|
| `to`/`search` 全变 `string` | 漏 `declare module Register` |
| `routeTree.gen.ts` 不更新 | Vite 插件顺序错（必须在 `react()` 前） |
| `useParams()` 返回 `undefined` | path 写成 `/users/{id}`，应为 `/users/$userId` |
| Link 不跳转 | 用了 `href` 而非 `to` |
| 进路由白屏 + 控制台 redirect 报错 | `beforeLoad` 抛了非 `redirect` 错误，或鉴权逻辑死循环 |
| 预取与 Query 缓存打架 | `defaultPreloadStaleTime` 未设 0 |
| 切路由丢状态 | 未用 `<Outlet />`，或 layout 父路由未定义 |

## 12. 该不该选 TanStack Router

| 需求 | 选择 |
|------|------|
| TypeScript 优先、要类型安全 URL | ✅ TanStack Router |
| 已用 React Router v7、类型要求不高 | 维持 RR v7 |
| 全栈 SSR + server functions | TanStack Start（基于本路由）或 Next.js（见 [../nextjs/references/app-router.md](../../nextjs/references/app-router.md)） |
| 纯静态站点 | 任意，RR 够用 |

与 React Router v7 的关键差异：file-based 内建、search params schema 校验、loader/loaderData 全链路推断——RR v7 framework mode 才有相近能力。
