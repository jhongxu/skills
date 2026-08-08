# MSW v2

> 面向 `msw@2.15`（2026 年最新）。网络级 API mock 库：拦截真实 HTTP 请求并返回你定义的响应，而非 monkey-patch `fetch`/`axios`。同一套 handler 定义驱动单元测试、组件测试、Storybook、本地开发 server——写一次 mock，到处复用。

为什么用 MSW v2：网络边界拦截（不耦合 HTTP 客户端实现，换 fetch↔axios mock 不破）、基于标准 `Request`/`Response` Web API（`http` 命名空间 + `HttpResponse` 助手）、Node 端 `setupServer`（Vitest/Jest）、浏览器端 `setupWorker`（Service Worker）、GraphQL 原生支持。v2 重写了 v1 的 `rest`/`graphql`，handler 签名从 `(req, res, ctx)` 改为 `({ request, params, cookies })`。

## 1. 安装

```bash
pnpm add -D msw
```

浏览器使用还需生成 Service Worker 脚本（Node 测试不需要）：

```bash
npx msw init ./public --save    # 生成 mockServiceWorker.js 到 public/
```

要求 Node 18+（v2 依赖内置 `fetch`）。

## 2. 定义 handlers

handlers 是 MSW 的核心——匹配 HTTP method + URL，返回响应：

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // GET：返回 JSON 列表
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Ada Lovelace' },
      { id: 2, name: 'Grace Hopper' },
    ])
  }),

  // GET 带路径参数
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ id: Number(params.id), name: 'Ada' })
  }),

  // POST：读请求体，返回 201
  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as { name: string }
    return HttpResponse.json({ id: 99, name: body.name }, { status: 201 })
  }),

  // 模拟错误
  http.get('/api/error', () => {
    return HttpResponse.json({ error: '服务器错误' }, { status: 500 })
  }),
]
```

### `HttpResponse` 助手

| 调用 | 用途 |
|------|------|
| `HttpResponse.json(data)` | 200 JSON |
| `HttpResponse.json(data, { status: 201 })` | 自定义状态码 JSON |
| `HttpResponse.text('OK')` | 纯文本 |
| `HttpResponse.json(null, { status: 404 })` | 错误响应 |
| `new HttpResponse(null, { status: 204 })` | 无内容 |
| `HttpResponse.json(data, { headers: {...} })` | 带响应头 |

## 3. Node 测试：`setupServer`（Vitest）

```ts
// src/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { server } from './src/mocks/server'

export default defineConfig({
  test: {
    setupFiles: ['./src/mocks/setup.ts'],
  },
})
```

```ts
// src/mocks/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())   // 每个测试后还原默认 handler
afterAll(() => server.close())
```

> `onUnhandledRequest: 'error'` 让未匹配的请求报错（默认 `'warn'`），防止测试意外打到真实网络。Vitest 配置见 [../foundation/references/vitest.md](../foundation/references/vitest.md)。

### 测试里覆盖 handler

```ts
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'

it('加载失败时显示错误', async () => {
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json({ error: 'down' }, { status: 500 })
    }),
  )
  render(<UserList />)
  expect(await screen.findByText('加载失败')).toBeInTheDocument()
})
```

`server.use()` 的 handler 在当前测试内生效，`afterEach` 的 `resetHandlers()` 会清掉。

## 4. 浏览器开发：`setupWorker`

```ts
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

```ts
// src/main.tsx
async function enableMocking() {
  if (import.meta.env.PROD) return
  const { worker } = await import('./mocks/browser')
  return worker.start({
    onUnhandledRequest: 'warn',   // 未匹配请求警告（不打断）
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  })
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
})
```

> `worker.start()` 必须在 app 发请求前 `await`，否则早期请求漏拦截。开发环境启用，生产环境跳过。

## 5. v1 → v2 迁移

| v1（废弃） | v2 |
|-----------|-----|
| `import { rest } from 'msw'` | `import { http } from 'msw'` |
| `rest.get(path, (req, res, ctx) => res(ctx.json(...)))` | `http.get(path, () => HttpResponse.json(...))` |
| `rest.post` | `http.post` |
| `graphql.query` | `graphql.query`（签名变了） |
| `(req, res, ctx)` 三参数 | `({ request, params, cookies })` 解构 |
| `res(ctx.status(201), ctx.json(data))` | `HttpResponse.json(data, { status: 201 })` |
| `ctx.delay(1000)` | `await delay(1000)`（从 `msw` 导入 `delay`） |

```ts
// v1
rest.get('/users', (req, res, ctx) => {
  return res(ctx.status(200), ctx.json([{ id: 1 }]))
})

// v2
http.get('/users', () => {
  return HttpResponse.json([{ id: 1 }])
})
```

## 6. 请求信息与动态响应

```ts
import { http, HttpResponse, delay } from 'msw'

http.get('/api/search', async ({ request }) => {
  const url = new URL(request.url)
  const q = url.searchParams.get('q')
  const page = Number(url.searchParams.get('page') ?? '1')

  await delay(300)   // 模拟网络延迟

  return HttpResponse.json({ q, page, results: [] })
})

// 读 cookies
http.get('/api/me', ({ cookies }) => {
  if (!cookies.session) {
    return HttpResponse.json({ error: '未登录' }, { status: 401 })
  }
  return HttpResponse.json({ user: { id: 1 } })
})
```

## 7. GraphQL

```ts
import { graphql } from 'msw'

export const handlers = [
  graphql.query('GetUsers', ({ variables }) => {
    return HttpResponse.json({
      data: {
        users: [{ id: 1, name: 'Ada' }],
      },
    })
  }),

  graphql.mutation('CreateUser', async ({ variables }) => {
    return HttpResponse.json({
      data: { createUser: { id: 99, ...variables } },
    })
  }),
]
```

## 8. 复用 handlers（单元/组件/Storybook/dev）

同一份 `handlers.ts` 驱动所有场景：

```ts
// Storybook 预览
// .storybook/preview.tsx
import { worker } from '../src/mocks/browser'
worker.start({ onUnhandledRequest: 'warn' })
```

```ts
// Story 里覆盖
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/users', async () => {
          await delay('infinite')   // 永不返回，测加载态
        }),
      ],
    },
  },
}
```

## 9. 与本仓库其他 skill 的衔接

- 测试运行器用 Vitest，见 [../foundation/references/vitest.md](../foundation/references/vitest.md)（`setupFiles` 里 `server.listen`）。
- mock tRPC 请求：MSW 拦截 `/api/trpc/*` 的 HTTP 调用，见 [trpc](trpc.md)。
- mock TanStack Query 的 fetch：MSW 拦截底层 `fetch`，见 [../tanstack/references/query.md](../tanstack/references/query.md)。
- 表单提交 mock：见 [react-hook-form](react-hook-form.md) 的 `setError` 服务端错误测试。
- eslint/类型 见 [../foundation/references/eslint-antfu.md](../foundation/references/eslint-antfu.md)。

## 10. 坑

| 坑 | 说明 |
|----|------|
| 浏览器请求没被拦截 | `worker.start()` 没 `await`；或 Service Worker 路径错；或 `mockServiceWorker.js` 没生成 |
| Node 测试请求漏拦截 | `server.listen()` 没在 `setupFiles` 里先跑；或某模块在 listen 前缓存了 `fetch` 引用 |
| `rest is not a function` | v1 语法在 v2 不存在；改 `http` 命名空间 |
| `(req, res, ctx)` 签名报错 | v2 改为 `({ request, params, cookies })` |
| `ctx.delay` / `ctx.json` 找不到 | v2 用 `delay()` / `HttpResponse.json()`，无 `ctx` |
| 未匹配请求打到真实网络 | 默认 `'warn'`；测试里设 `'error'` 强制 |
| Storybook 加载态卡死 | `delay('infinite')` 不会返回，需单独 story |
| 生产环境带入了 worker | `import.meta.env.PROD` 时跳过 `worker.start()` |
| tRPC 批量请求难 mock | `httpBatchLink` 把多 query 合一次 POST；mock 整个 `/api/trpc` 端点或用 `httpLink` 拆开 |
| `server.use()` 跨测试泄漏 | `afterEach` 里 `server.resetHandlers()` 还原默认 |
| Node < 18 报错 | v2 依赖内置 `fetch`；用 Node 18+ |
