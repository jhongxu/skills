# tRPC v11

> 面向 `@trpc/server@11` + `@trpc/react-query@11`（v11 稳定，与 v10 向后兼容）。端到端类型安全的 API 层：服务端函数即 API，TypeScript 自动推断类型并贯穿到客户端调用。无需 schema 文件、无需 codegen。基于 TanStack Query，集成 RSC、Suspense、SSE 流式。

为什么用 tRPC：全栈 TypeScript monorepo 里零开销的端到端类型安全；服务端函数签名即契约；与 React Query 深度集成（缓存、乐观更新、devtools 白送）；RSC 里可直接调 procedure 无 HTTP 往返。

> Server Components 已解决很多 tRPC 设计解决的问题——RSC 项目里你可能不需要 tRPC。但跨多个客户端（移动端、第三方）或需要统一 API 层时 tRPC 仍有价值。

## 1. 安装

```bash
pnpm add @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod superjson
```

- `@trpc/react-query`：v11 起的包名（v10 是 `@trpc/react-query`，v9 是 `@trpc/next`）
- peer 依赖 `@tanstack/react-query@^5`
- `zod`：procedure input 校验，见 [zod](zod.md)
- `superjson`：跨网络序列化 Date/Map/Set/undefined

## 2. 服务端：定义 router

```ts
// server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { cache } from 'react'   // Next.js App Router：每请求隔离 context

export const createTRPCContext = cache(async () => {
  return { userId: 'user_123', db }
})

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,   // 序列化 Date/Map/Set
})

export const router = t.router
export const publicProcedure = t.procedure
export const middleware = t.middleware
export const createCallerFactory = t.createCallerFactory
```

```ts
// server/routers/_app.ts
import { z } from 'zod'
import { publicProcedure, router, createTRPCContext } from '../trpc'

export const appRouter = router({
  user: router({
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input, ctx }) => {
        const user = await ctx.db.user.findUnique({ where: { id: input.id } })
        if (!user) throw new TRPCError({ code: 'NOT_FOUND' })
        return user
      }),

    create: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.email(),
      }))
      .mutation(async ({ input, ctx }) => {
        return ctx.db.user.create({ data: input })
      }),
  }),
})

export type AppRouter = typeof appRouter   // 只导出类型，不导出实现
```

### 适配 Next.js App Router

```ts
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createTRPCContext } from '@/server/trpc'
import { appRouter } from '@/server/routers/_app'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  })

export { handler as GET, handler as POST }
```

## 3. 客户端：React Query 集成

```ts
// lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/server/routers/_app'

export const trpc = createTRPCReact<AppRouter>()
```

```tsx
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import superjson from 'superjson'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,          // 与服务端一致
          async headers() {
            return { authorization: getAuthCookie() }
          },
        }),
      ],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
```

## 4. 在组件里调用

```tsx
'use client'

import { trpc } from '@/lib/trpc'

export function UserCard({ id }: { id: string }) {
  // 自动生成类型安全的 hook：trpc.user.getById.useQuery
  const [user] = trpc.user.getById.useSuspenseQuery({ id })

  const createPost = trpc.user.create.useMutation({
    onSuccess: () => {
      // 自动 invalidate 涉及的 query
    },
  })

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => createPost.mutate({ name: 'Frodo', email: 'f@shire.me' })}>
        创建
      </button>
    </div>
  )
}
```

`trpc.user.getById` 的类型直接来自服务端 `appRouter`——改服务端返回值，客户端类型立即变化，`tsc` 报错。

> TanStack Query 的所有能力（`status`/`fetchStatus`、query key factory、乐观更新、devtools）都适用，见 [../tanstack/references/query.md](../tanstack/references/query.md)。

## 5. RSC 直接调用（server caller）

App Router 的 Server Component 里无需 HTTP 往返，直接调 procedure：

```tsx
// app/users/page.tsx（Server Component）
import { createCallerFactory } from '@/server/trpc'
import { appRouter } from '@/server/routers/_app'
import { createTRPCContext } from '@/server/trpc'

const createCaller = createCallerFactory(appRouter)

export default async function Page() {
  const ctx = await createTRPCContext()
  const caller = createCaller(ctx)
  const users = await caller.user.list()   // 直接调用，无 HTTP

  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

> Server Action 里也用 caller 模式调 procedure，见 [../nextjs/references/server-actions.md](../nextjs/references/server-actions.md)。

## 6. Context 与 Middleware

```ts
// server/trpc.ts
const enforceAuth = middleware(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { ...ctx, user: ctx.userId } })   // 增强 ctx
})

export const protectedProcedure = publicProcedure.use(enforceAuth)
```

```ts
// 只登录用户能调
export const appRouter = router({
  profile: router({
    get: protectedProcedure.query(({ ctx }) => {
      // ctx.user 类型已增强
      return db.user.findUnique({ where: { id: ctx.user } })
    }),
  }),
})
```

Middleware 顺序：`publicProcedure.use(loggingMiddleware).use(authMiddleware).use(rateLimit)`。

## 7. 错误处理

```ts
import { TRPCError } from '@trpc/server'

throw new TRPCError({
  code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'BAD_REQUEST' | 'INTERNAL_SERVER_ERROR',
  message: '用户不存在',
  cause: originalError,   // 保留原始错误链
})
```

Zod 校验失败自动转 `BAD_REQUEST`，issue 结构透传给客户端。自定义 errorFormatter 整形 Zod 错误：

```ts
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})
```

## 8. 链接（Links）

```ts
trpc.createClient({
  links: [
    loggerLink(),                  // 日志
    httpBatchLink({                // 批量请求：多个 query 合并一次 HTTP
      url: '/api/trpc',
      transformer: superjson,
      maxURLLength: 2083,          // 超 URL 长度自动拆分
    }),
    // httpLink({ url: ... })      // 不批量，逐个请求
    // wsLink({ client })          // WebSocket（subscription）
  ],
})
```

## 9. 与本仓库其他 skill 的衔接

- procedure input 校验用 Zod，见 [zod](zod.md)。
- 客户端缓存/状态/乐观更新基于 TanStack Query，见 [../tanstack/references/query.md](../tanstack/references/query.md)。
- Next.js App Router 集成（Provider 放 client 边界）见 [../nextjs/references/rsc-patterns.md](../nextjs/references/rsc-patterns.md)。
- API mock（测试时拦截 tRPC 请求）用 MSW，见 [msw](msw.md)。
- 服务端取数的缓存模型（是否还需要 tRPC）见 [../nextjs/references/data-fetching.md](../nextjs/references/data-fetching.md)。

## 10. 坑

| 坑 | 说明 |
|----|------|
| 客户端拿到 `any` | 检查 `import type { AppRouter }` 是否用 `import type`（编译期剥离，不打包服务端代码） |
| `Date` 序列化丢失 | 服务端和客户端都要配 `transformer: superjson` |
| RSC 里用 `trpc.xxx.useQuery` 报错 | hook 只在 Client Component 用；RSC 用 server caller 直接调 |
| `@trpc/next` 找不到 | v11 移除；App Router 用 `@trpc/react-query` + 手动 Provider |
| Context 跨请求串数据 | Next.js 里用 `cache()` 包 context 工厂，确保每请求隔离 |
| query 不自动刷新 | mutation `onSuccess` 里调 `utils.user.getById.invalidate()` |
| `useQuery` vs `useSuspenseQuery` | Suspense 模式用 `useSuspenseQuery`（v11 推荐，配合 RSC 流式） |
| Zod 4 与 input 校验 | `z.string().email()` 弃用警告；改 `z.email()` |
| 批量请求超 URL 长度 | `httpBatchLink` 的 `maxURLLength` 自动拆分；或换 `httpLink` |
| 公网暴露 tRPC 端点 | tRPC 用 POST 不走 HTTP 缓存；公网 API 考虑 REST/OpenAPI（trpc-openapi 插件） |
