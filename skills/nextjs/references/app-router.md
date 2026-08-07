# App Router

> 面向 `next@16`（2025 年底发布，Turbopack 默认、Cache Components/PPR 默认）。App Router 是 Next.js 的标准路由方案，Pages Router 已属 legacy 不再获新特性。`app/` 目录基于文件系统约定，Server Components 默认。

为什么用 App Router：Server Components 默认（零客户端 JS）、嵌套布局跨导航持久化、路由级 `loading.tsx`/`error.tsx`、Parallel/Intercepting Routes、与 React 19 深度集成（`use`、Actions、Compiler）、PPR 静态壳 + 动态流式。

## 1. 安装与配置

```bash
pnpm create next-app@latest my-app
# 选 TypeScript / Tailwind / App Router / Turbopack
```

`next.config.ts`（16 起 Turbopack 默认，无需 `--turbopack` 标志）：

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,   // 16 新增：开启 Cache Components + PPR + use cache
  reactCompiler: true,     // React Compiler（15.x 是 experimental，16 稳定）
} satisfies NextConfig

export default nextConfig
```

```jsonc
// package.json —— 16 起脚本里不再需要 --turbopack
{ "scripts": { "dev": "next dev", "build": "next build", "start": "next start" } }
```

环境要求：Node.js 20.9+（18 不再支持）、TypeScript 5.1+、React 19。

## 2. 文件约定

`app/` 下每个文件夹是一个路由段，特殊文件名有固定语义：

| 文件 | 作用 |
|------|------|
| `page.tsx` | 路由 UI（定义可访问的路由） |
| `layout.tsx` | 共享布局（跨导航持久化，不重渲染） |
| `loading.tsx` | 加载态（自动包 Suspense） |
| `error.tsx` | 错误边界（必须是 `'use client'`） |
| `not-found.tsx` | 404 兜底 |
| `template.tsx` | 类似 layout 但每次导航重新挂载 |
| `route.ts` | API 路由（Route Handler） |
| `middleware.ts` | 中间件（根目录） |

```
app/
├── layout.tsx           # 根布局（必需）
├── page.tsx             # /
├── blog/
│   ├── layout.tsx       # /blog 共享布局
│   ├── page.tsx         # /blog
│   └── [slug]/
│       └── page.tsx     # /blog/:slug
└── (marketing)/         # 路由组：不影响 URL
    ├── about/page.tsx   # /about
    └── layout.tsx       # 组内共享布局
```

## 3. 异步 params / searchParams（v15 起 breaking，v16 移除同步）

`params` 和 `searchParams` 是 **Promise**，必须 `await`。v16 完全移除同步访问：

```tsx
// app/blog/[slug]/page.tsx
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  return <h1>{post.title}</h1>
}
```

`searchParams` 同理：

```tsx
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const results = await search(q)
  return <ResultsList items={results} />
}
```

### 类型生成（15.5+）

`npx next typegen` 生成全局类型助手，无需手写 props 类型：

```tsx
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params          // 类型安全
  const query = await props.searchParams
  return <h1>{slug}</h1>
}
```

## 4. 布局与嵌套

布局包裹子路由，**跨导航不重新挂载**（状态保留）：

```tsx
// app/layout.tsx —— 根布局（必需，含 html/body）
import { ConfigProvider } from 'antd'
import { App as AntdApp } from 'antd'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
          <AntdApp>{children}</AntdApp>
        </ConfigProvider>
      </body>
    </html>
  )
}
```

```tsx
// app/blog/layout.tsx
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="blog">
      <aside><BlogSidebar /></aside>
      <main>{children}</main>
    </div>
  )
}
```

> 根布局必须是 Server Component。要包 client context provider（主题、状态），见 [rsc-patterns](rsc-patterns.md) 的 context provider 模式。

## 5. 动态路由与静态生成

```tsx
// app/products/[id]/page.tsx
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)
  return <ProductDetail product={product} />
}

// 预生成静态路径
export async function generateStaticParams() {
  const products = await getProducts()
  return products.map(p => ({ id: p.id }))
}
```

Catch-all：`[...slug]` 匹配多层；`[[...slug]]` 可选 catch-all（含根）。

## 6. Route Handlers（API 路由）

`route.ts` 定义 API 端点，支持 Web Request/Response：

```ts
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const users = await getUsers()
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const user = await createUser(body)
  return NextResponse.json(user, { status: 201 })
}
```

Cache Components 开启后，`GET` Route Handler 遵循与页面相同的预渲染模型（可加 `'use cache'`）。

> 新项目优先用 Server Actions 替代手写 API 路由（见 [server-actions](server-actions.md)）。Route Handler 留给真正的第三方 webhook、健康检查等。

## 7. 中间件（middleware.ts）

放仓库根（与 `app/` 同级）或 `src/`。16 起 Node.js runtime 稳定：

```ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
  runtime: 'nodejs',   // 16 稳定；'edge' 在 Cache Components 下已废弃
}
```

> 中间件在每次请求跑，保持轻量。鉴权、重定向、A/B 测试、i18n 在这里做。不要在中间件里做重计算。

## 8. 导航与 `<Activity>`（v16 Cache Components）

开启 `cacheComponents` 后，客户端导航用 React `<Activity>` 保留组件状态——导航离开时旧路由设为 `hidden` 而非卸载，返回时状态还在：

- 表单输入、展开的折叠面板等 UI 状态在来回导航时保留
- hidden 时 effect 被清理，重新可见时重建
- Next.js 用启发式保留少量最近访问的路由，旧的移除防膨胀

```tsx
import Link from 'next/link'

<Link href="/blog" prefetch>文章</Link>   // prefetch 默认开
```

## 9. Parallel & Intercepting Routes

**Parallel Routes**（`@slot`）：同一路由并行渲染多个页面，常用于 dashboard：

```
app/dashboard/
├── layout.tsx        # 接收 @analytics, @team, children
├── @analytics/page.tsx
├── @team/page.tsx
└── page.tsx
```

```tsx
export default function DashboardLayout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  team: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-2">
      <div>{children}</div>
      <div>{analytics}</div>
      <div>{team}</div>
    </div>
  )
}
```

**Intercepting Routes**（`(.)`/`(..)`/`(...)`）：拦截导航，在当前布局内展示另一路由的内容（如 Modal 展示详情页，同时保留独立 URL）：

```
app/
├── feed/page.tsx
├── photo/[id]/page.tsx          # 直接访问是全页
└── feed/(..)photo/[id]/page.tsx # 从 feed 点进来是 Modal
```

## 10. 元数据

```tsx
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'My App', template: '%s | My App' },
  description: '...',
}

// app/blog/[slug]/page.tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  return { title: post.title, description: post.excerpt }
}
```

## 11. 与本仓库其他 skill 的衔接

- 数据获取与缓存见 [data-fetching](data-fetching.md)（`use cache`/`cacheLife`/PPR）。
- 表单提交与变更见 [server-actions](server-actions.md)。
- Server/Client 组件组合见 [rsc-patterns](rsc-patterns.md)。
- UI 用 [../ui/references/antd-v6.md](../ui/references/antd-v6.md)，根布局里包 ConfigProvider。
- URL 状态见 [../nuqs/SKILL.md](../nuqs/SKILL.md)（searchParams 同步）。
- 表单进阶见 [../tanstack/references/form.md](../tanstack/references/form.md)。
- 工具链见 [../foundation/SKILL.md](../foundation/SKILL.md)（pnpm/vitest/eslint）。

## 12. 坑

| 坑 | 说明 |
|----|------|
| `params` 同步访问报错 | v16 完全移除同步；`await params` |
| 布局状态丢失 | 检查是否用了 `template.tsx`（每次重挂载）；或导航被 `cacheComponents` 的 Activity 保留——别依赖卸载副作用 |
| middleware 里用 Edge runtime 报错 | Cache Components 要求 Node.js runtime；`runtime: 'nodejs'` |
| 自定义 webpack 配置构建失败 | 16 默认 Turbopack；用 `next build --webpack` 退回，或迁移到 turbopack 配置 |
| `--turbopack` 标志多余 | 16 起默认开，从 scripts 里删掉 |
| `next lint` 不可用 | 15.5 起废弃；用 [../foundation/references/eslint-antfu.md](../foundation/references/eslint-antfu.md) 替代 |
| Route Handler 缓存不符预期 | 开了 `cacheComponents` 后 GET 遵循预渲染模型；加 `'use cache'` 显式缓存 |
| Sass `~` 前缀报错 | Turbopack 不支持 tilde，改直接 `@import 'pkg/path'` |
