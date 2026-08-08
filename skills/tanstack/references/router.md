# TanStack Router

> 面向 `@tanstack/react-router@1.169+`（2026-08，lane rewrite 后）。全类型推断的客户端路由：文件路由 + 类型安全的 params/search/loader/preloading。版本敏感，写之前以官方文档为准。SSR/全栈场景看 TanStack Start，本篇覆盖 SPA 路由核心。

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

- 插件顺序——`tanstackRouter()` 必须在 `react()` 之前，否则 `routeTree.gen.ts` 不更新。
- `autoCodeSplitting: true` 按路由自动拆包，2026 推荐开启。
- 要求 Node `>=20.19`、TypeScript `>=5.3`（strict 强烈推荐，否则推断打折）。
- 其他构建器：Rspack/Rsbuild、Webpack、Esbuild 均有对应插件；或用 Router CLI。

## 2. 创建 Router + Register（必须）

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen' // 插件自动生成，勿手改

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
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

漏掉 `Register` 增强是最常见坑——`to=`、`search=`、`useSearch()` 全部失去类型推断，退回 `string` / `unknown`。

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
| `_pathlessLayout.tsx` | — | 无路径 layout（pathless） |
| `file.$` | `/file/$` | 转义字面量 `$` |

父路由组件里用 `<Outlet />` 渲染子路由。

### Code-Based Routing（替代方案）

不用文件路由，纯代码构建 route tree（官方不推荐，文件路由优先）：

```tsx
import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'

const rootRoute = createRootRoute({ component: RootLayout })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home })
const postsRoute = createRoute({ getParentRoute: () => rootRoute, path: 'posts', component: Posts })
const postRoute = createRoute({
  getParentRoute: () => postsRoute,
  path: '$postId',
  component: Post,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  postsRoute.addChildren([postRoute]),
])

const router = createRouter({ routeTree })
```

> 文件路由和代码路由用同一 route tree 概念，只是组织方式不同。库/嵌入式场景才考虑代码路由。

## 4. 定义路由

### 根路由（带 context）

```tsx
// src/routes/__root.tsx
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import type { QueryClient } from '@tanstack/react-query'

export interface RouterContext {
  queryClient: QueryClient
  auth: { user: User | null }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <h1>404</h1>,
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

用 `createRootRouteWithContext<T>()` 而非 `createRootRoute()`，方便注入 `queryClient`/`auth` 等依赖。

### 普通路由

```tsx
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => fetchPost(params.postId),
  pendingComponent: () => <Spinner />,
  errorComponent: ({ error }) => <ErrorView error={error} />,
  component: PostComponent,
})

function PostComponent() {
  const post = Route.useLoaderData()      // 类型推断为 Post
  const { postId } = Route.useParams()    // { postId: string }
  return <article><h1>{post.title}</h1></article>
}
```

`createFileRoute('/path')` 的 path 参数是给 TS 推断用的——插件自动同步，**别手改**。

## 5. 动态段与 Path Params

`$name` 捕获单段，`$` 捕获多段 splat：

```tsx
// src/routes/files/$.tsx → /files/*
function Files() {
  const { '*': splat } = Route.useParams()   // /files/a/b/c → 'a/b/c'
}
```

把 `postId: string` 转成数字，用 `params` 选项（不要在组件里 `Number()` 转换，会丢类型安全）：

```tsx
export const Route = createFileRoute('/posts/$postId')({
  params: {
    parse: ({ postId }) => ({ postId: Number(postId) }),
    stringify: ({ postId }) => ({ postId: String(postId) }),
  },
})
```

## 6. Search Params —— 带 schema 的 URL 状态

URL search 不再是 `string | null` 手拼，而是经校验的强类型状态。

### 用 Zod 适配器

```bash
pnpm add @tanstack/zod-adapter zod
```

```tsx
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
}
```

> **Zod 4 注意**：`@tanstack/zod-adapter` 与 Zod 4 不兼容（peerDep 锁 zod@3）。Zod 4 项目可不用适配器，直接传 `validateSearch` 自定义函数，或锁 zod@3。Zod 本身见 [../data-and-forms/references/zod.md](../../data-and-forms/references/zod.md)。

### 自定义序列化（不用 Zod）

```tsx
export const Route = createFileRoute('/posts/')({
  validateSearch: (input: Record<string, unknown>) => {
    const page = Number(input.page ?? 1)
    return { page: Number.isNaN(page) ? 1 : page }
  },
})
```

### search middlewares：跨导航保留/清除参数

```tsx
import { retainSearchParams, stripSearchParams } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/')({
  middleware: [retainSearchParams(['page']), stripSearchParams(['tag'])],
})
```

### 类型安全地更新 search

```tsx
const navigate = useNavigate({ from: '/posts' })
navigate({ search: prev => ({ ...prev, page: prev.page + 1 }) })  // 函数式更新
```

## 7. Route Masking（URL 掩码）

实际路由 `/posts/$postId`，URL 栏显示 `/posts/$slug`（可分享、SEO 友好）：

```tsx
export const Route = createFileRoute('/posts/$postId')({
  params: {
    parse: ({ postId }) => ({ postId: Number(postId) }),
    stringify: ({ postId }) => ({ postId: String(postId) }),
  },
  // URL 显示成 /posts/hello-world，内部仍匹配 /posts/:postId
  params: {
    stringify: ({ postId }) => ({ postId: String(postId) }),
  },
})
```

> Route masking 在 `createRouter` 配 `routeMask` 或在路由级配 `params.stringify` 返回语义化 slug。

## 8. loader vs beforeLoad

两个都「组件渲染前」跑，但语义不同：

| | `beforeLoad` | `loader` |
|---|---|---|
| 执行顺序 | **串行**（父→子） | **并行**（所有匹配路由同时） |
| 用途 | 鉴权、context 累积、重定向 | 取数 |
| 返回值 | 并入 router context（子路由可读） | 作为 loader data（仅本路由） |
| redirect | `throw redirect({ to })` | 一般不在这重定向 |

### beforeLoad：鉴权 + context 累积

```tsx
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { user: context.auth.user }   // 子路由通过 context.user 读到
  },
})
```

抛 `redirect` 会中断后续 beforeLoad 与 loader；`isRedirect` 错误由 router 识别处理。

### loader：取数 + pending/error 状态

```tsx
export const Route = createFileRoute('/posts')({
  loader: async ({ params }) => fetchPosts(),
  pendingComponent: () => <Spinner />,
  errorComponent: ({ error }) => <ErrorView error={error} />,
  component: Posts,
})
```

## 9. Deferred Data Loading（流式渲染）

关键数据等完再渲染，慢数据后台加载、流式注入。两种模式：

### 原生 defer + `<Await>`

```tsx
import { createFileRoute, Await } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async () => {
    const slowDataPromise = fetchSlowData()   // 不 await
    const fastData = await fetchFastData()    // await 快数据
    return { fastData, deferredSlowData: slowDataPromise }
  },
  component: PostComponent,
})

function PostComponent() {
  const { fastData, deferredSlowData } = Route.useLoaderData()
  return (
    <>
      <div>{fastData}</div>
      <Await promise={deferredSlowData} fallback={<Spinner />}>
        {(data) => <div>{data}</div>}
      </Await>
    </>
  )
}
```

> React 19 可用 `use(deferredSlowData)` 替代 `<Await>`。

### TanStack Query 模式（推荐）

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(slowDataOptions())        // 不 await
    await queryClient.ensureQueryData(fastDataOptions()) // await 快数据
  },
  component: PostComponent,
})

function PostComponent() {
  const fastData = useSuspenseQuery(fastDataOptions())
  return (
    <Suspense fallback={<Spinner />}>
      <SlowDataComponent />
    </Suspense>
  )
}
```

## 10. Data Mutations

Router 不管 mutation state——它只负责**取数后失效缓存**。mutation 状态用 TanStack Query（见 [query.md](query.md)）。

```tsx
import { useRouter } from '@tanstack/react-router'

function EditPost() {
  const router = useRouter()
  const save = async (data: Post) => {
    await api.updatePost(data)
    router.invalidate()                      // 失效所有 loader 缓存，后台 revalidate
    // await router.invalidate({ sync: true }) // 阻塞等所有 loader 完成
  }
}
```

- `router.invalidate()`：失效已提交/缓存/进行中的 loader；活跃 preload lane 退役；活跃 match 后台重载（旧数据可见直到新数据就绪）。
- `{ sync: true }`：阻塞等所有 loader 完成才 resolve。
- mutation state 清理：用 `router.subscribe('onResolved', ...)` 在路由切换时清旧 mutation state。

## 11. 导航

### `<Link>` —— 类型安全

```tsx
<Link to="/posts/$postId" params={{ postId: 123 }} search={{ sort: 'top' }}>
  文章
</Link>
```

`to` / `params` / `search` 全部按 route tree 推断：拼错路径、漏 params、search 字段类型不符都会编译报错。

### Link Options

```tsx
<Link to="/posts" preload="intent" activeOptions={{ exact: true }}>
  文章
</Link>
```

| 选项 | 说明 |
|------|------|
| `preload` | `'intent'`/`'viewport'`/`'render'`/`false` |
| `activeProps` | 活跃时附加 props（如 `className`） |
| `activeOptions` | `{ exact, includeSearch, includeHash }` |
| `disabled` | 禁用链接（不渲染 `<a>`） |
| `replace` | `replace` 而非 `push` |

### Custom Link

```tsx
import { createLink } from '@tanstack/react-router'

const StyledLink = createLink(({ to, children, ...props }) => (
  <a {...props} className="text-blue-500 hover:underline">{children}</a>
))

<StyledLink to="/posts">文章</StyledLink>
```

### `useNavigate` —— 命令式

```tsx
const navigate = useNavigate({ from: '/posts' })
await navigate({ search: { page: 2 } })   // 返回 Promise，导航完成 resolve
```

### `redirect`

```tsx
import { redirect } from '@tanstack/react-router'
throw redirect({ to: '/login', search: { redirect: location.href } })
```

## 12. Navigation Blocking（防离开）

防止用户在有未保存更改时离开：

```tsx
import { useBlocker } from '@tanstack/react-router'

function EditForm() {
  const [isDirty, setIsDirty] = useState(false)

  useBlocker(isDirty, () => {
    // 返回 true 允许离开，false 取消
    return window.confirm('有未保存更改，确定离开？')
  })

  // 或用 promise 形式
  // useBlocker(isDirty, async () => { ... })
}
```

- 阻塞器按顺序异步执行；任一返回 `false` 取消导航。
- 页面卸载（关 tab/刷新）走浏览器 `onbeforeunload` 原生对话框（不可自定义）。
- 组件式：`<Blocker />` 组件封装。

## 13. 预加载

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

## 14. Router Events

```tsx
router.subscribe('onResolved', (event) => {
  // 路径变化并最终 resolve 后触发（非 reload）
  analytics.track('page_view', { path: event.toLocation.pathname })
})

router.subscribe('onBeforeLoad', ({ to, from }) => {
  // 导航开始前
})
```

常用事件：`onBeforeLoad`、`onLoad`、`onResolved`、`onRejected`。用于埋点、清 mutation state、全局 loading bar。

## 15. Not Found Errors

```tsx
export const Route = createFileRoute('/posts/$postId')({
  notFoundComponent: () => <div>文章不存在</div>,
  component: Post,
})
```

根路由配 `notFoundComponent` 兜底所有 404。`throw new NotFoundError()` 主动抛 404。

## 16. Document Head Management

```tsx
export const Route = createFileRoute('/posts/$postId')({
  head: () => ({
    title: '文章详情',                        // <title>
    meta: [{ name: 'description', content: '...' }],
    links: [{ rel: 'canonical', href: '...' }],
    scripts: [{ src: '/embed.js', async: true }],
  }),
})
```

## 17. SSR

```tsx
// SSR：用 createMemoryHistory + server render
import { createMemoryHistory, createRouter } from '@tanstack/react-router'

const router = createRouter({
  routeTree,
  history: createMemoryHistory({ initialEntries: [url] }),
})

const html = await renderToString(<RouterProvider router={router} />)
```

> 完整 SSR/streaming 用 TanStack Start（基于本路由 + server functions）。SPA 场景不需要 SSR。SSR streaming 配合 Deferred Data Loading 见 [第 9 节](#9-deferred-data-loading流式渲染)。

## 18. 与 TanStack Query 集成（推荐模式）

router 当**协调器**，Query 当**缓存层**：

```tsx
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

const postsQuery = queryOptions({ queryKey: ['posts'], queryFn: fetchPosts })

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

为什么走 loader + `ensureQueryData` 而不是组件里直接 `useQuery`：无 loading 闪烁、无组件取数瀑布、预加载时 Query 缓存被预热。Query 细节见 [query.md](query.md)。

## 19. ESLint Plugin

```bash
pnpm add -D @tanstack/eslint-plugin-router
```

```ts
// eslint.config.ts
import routerPlugin from '@tanstack/eslint-plugin-router'

export default [
  routerPlugin.configs.recommended,
]
```

关键规则 `create-route-property-order`：强制 route 定义属性顺序（`validateSearch` → `params` → `loader` → `beforeLoad` → `component`），避免顺序导致的类型推断问题。

## 20. 速查：常见坑

| 症状 | 原因 |
|------|------|
| `to`/`search` 全变 `string` | 漏 `declare module Register` |
| `routeTree.gen.ts` 不更新 | Vite 插件顺序错（必须在 `react()` 前） |
| `useParams()` 返回 `undefined` | path 写成 `/users/{id}`，应为 `/users/$userId` |
| Link 不跳转 | 用了 `href` 而非 `to` |
| 进路由白屏 + 控制台 redirect 报错 | `beforeLoad` 抛了非 `redirect` 错误，或鉴权逻辑死循环 |
| 预取与 Query 缓存打架 | `defaultPreloadStaleTime` 未设 0 |
| 切路由丢状态 | 未用 `<Outlet />`，或 layout 父路由未定义 |
| mutation 后数据不刷新 | 没调 `router.invalidate()`；或 Query 的 `queryClient.invalidateQueries` |
| deferred 数据不流式渲染 | SSR 需配置 streaming；SPA 用 `<Await>` 或 React 19 `use()` |
| 路由属性顺序导致类型丢失 | 装 `@tanstack/eslint-plugin-router`，规则 `create-route-property-order` |
| Zod 4 + zod-adapter 报错 | peerDep 锁 zod@3；改自定义 `validateSearch` 或锁 zod@3 |

## 21. 该不该选 TanStack Router

| 需求 | 选择 |
|------|------|
| TypeScript 优先、要类型安全 URL | ✅ TanStack Router |
| 已用 React Router v7、类型要求不高 | 维持 RR v7 |
| 全栈 SSR + server functions | TanStack Start（基于本路由）或 Next.js（见 [../nextjs/references/app-router.md](../../nextjs/references/app-router.md)） |
| 纯静态站点 | 任意，RR 够用 |

与 React Router v7 的关键差异：file-based 内建、search params schema 校验、loader/loaderData 全链路推断——RR v7 framework mode 才有相近能力。
