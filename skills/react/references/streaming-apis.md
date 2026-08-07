# Server / Streaming APIs

> `react-dom/server` 与 `react-dom/static` 的服务端渲染 API。React 19 引入 `resume`/`prerender` 系列，支持 PPR（Partial Prerendering）与流式 SSR。版本敏感，以下来自官方文档核对。

## 1. API 总览

| API | 运行时 | 用途 |
|-----|--------|------|
| `renderToPipeableStream` | Node Stream | 流式 SSR 到 Node 管道 |
| `renderToReadableStream` | Web Stream | 流式 SSR 到 Web ReadableStream（Workers/Deno/Bun） |
| `renderToStaticMarkup` | 字符串 | 静态 HTML（无 hydration，遗留） |
| `renderToString` | 字符串 | **不推荐**——无法流式/Suspense，仅遗留兼容 |
| `resume` | Web Stream | 恢复一个被 `prerender` 暂停的渲染 |
| `resumeToPipeableStream` | Node Stream | 同上，Node 管道版 |
| `prerender` | Web Stream | 静态预渲染（可 postpone 暂停） |
| `prerenderToNodeStream` | Node Stream | 同上，Node 版 |
| `resumeAndPrerender` | Web Stream | resume 后继续预渲染到完成 |
| `resumeAndPrerenderToNodeStream` | Node Stream | 同上，Node 版 |

> 框架（Next.js 等）通常封装了这些 API，业务代码很少直接调。下面给框架无关的用法。

## 2. `renderToPipeableStream`（Node 流式 SSR）

```ts
import { renderToPipeableStream } from 'react-dom/server'

export function handler(req, res) {
  const { pipe, abort } = renderToPipeableStream(<App />, {
    bootstrapScripts: ['/main.js'],
    onShellReady() {
      res.setHeader('content-type', 'text/html')
      pipe(res)                 // shell 就绪即开始流式输出
    },
    onShellError(error) {
      res.status(500).send('<h1>Something went wrong</h1>')
    },
    onError(error) {
      console.error(error)       // 记录所有服务端错误（含可恢复）
    },
    onAllReady() {
      // 仅爬虫/静态生成场景用：等所有内容就绪再输出（失去流式）
    },
  })

  // 超时中止（避免慢查询拖死整个响应）
  setTimeout(() => abort(), 10000)
}
```

### 关键概念

- **Shell**：Suspense 边界之外的初始 HTML。`onShellReady` 触发后即可 `pipe`——客户端能尽早开始 hydrate，Suspense 内的内容随数据到达流式补全。
- **`onShellError`**：shell 渲染失败（如根组件抛错）→ 整页 500。
- **`onError`**：所有服务端错误（可恢复 + 不可恢复）都触发；默认只 `console.error`。
- **abort**：超时或请求取消时调，React 会触发客户端降级（fallback 或 client-only 渲染）。

### 设置状态码

```ts
let didError = false
const { pipe } = renderToPipeableStream(<App />, {
  onShellReady() {
    res.statusCode = didError ? 500 : 200
    res.setHeader('content-type', 'text/html')
    pipe(res)
  },
  onError(error) {
    didError = true
    console.error(error)
  },
})
```

## 3. `renderToReadableStream`（Web Stream）

API 类似，但返回 Promise<ReadableStream>，适合 Cloudflare Workers / Deno / Bun：

```ts
import { renderToReadableStream } from 'react-dom/server'

export async function handler(request) {
  const stream = await renderToReadableStream(<App />, {
    bootstrapScripts: ['/main.js'],
    onError(error) { console.error(error) },
  })
  return new Response(stream, {
    headers: { 'content-type': 'text/html' },
  })
}
```

支持 `onAllReady` 的 `stream.allReady` promise（爬虫场景等待全部内容）。

## 4. `prerender` + `resume`：PPR 风格预渲染

这是 React 19 的核心新增。**两阶段渲染**：

1. **Layer 1（prerender）**：渲染到能渲染的部分，遇到动态数据时**postpone**（暂停），输出 `prelude`（已渲染 HTML）+ `postponedState`（不透明状态对象，需存储）。
2. **Layer 2（resume）**：拿到请求上下文（如 cookies）后，用 `postponedState` 恢复渲染，补全动态部分。

适合 PPR：静态部分预渲染一次缓存，动态部分请求时 resume。

### 示例

```ts
import { prerender } from 'react-dom/static'
import { resume } from 'react-dom/server'

// --- 构建时 / 缓存填充 ---
async function buildAndCache() {
  const controller = new AbortController()
  const { prelude, postponed } = await prerender(<App />, {
    signal: controller.signal,
    bootstrapScripts: ['/main.js'],
    onError(error) { console.error(error) },
  })

  // prelude 是 Web Stream；消费成 HTML 字符串缓存
  const html = await streamToString(prelude)
  // postponed 是不透明对象，序列化后存到 redis/S3
  await cache.set('postponed:' + routeKey, JSON.stringify(postponed))
  await cache.set('prelude:' + routeKey, html)
}

// --- 请求时 ---
async function handleRequest(req, res) {
  const postponedState = await cache.get('postponed:' + routeKey)
  if (!postponedState) return fullRender(req, res)  // 缓存未命中

  const stream = await resume(<App />, JSON.parse(postponedState), {
    onError(error) { console.error(error) },
  })
  res.setHeader('content-type', 'text/html')
  stream.pipeTo(writable)
}
```

### `resume` 注意事项

- `reactNode` 必须与 `prerender` 时**完全一致**（同根 `<App />`，需渲染 `<html>`）
- `postponedState` 必须从存储中取出原样传入
- `resume` **不接受** `bootstrapScripts`/`bootstrapModules`——这些在 `prerender` 时给
- `resume` **不接受** `identifierPrefix`——需与 `prerender` 一致
- `nonce` 仅在 `prerender` 没传 scripts 时才能传给 `resume`
- resume 从根重新渲染，遇到第一个未完全预渲染的组件时停下继续——已完全预渲染的部分会被跳过

## 5. `prerenderToNodeStream` / `resumeToPipeableStream` / `resumeAndPrerender`

- `prerenderToNodeStream`：Node 版 `prerender`，返回 `{ prelude: NodeStream, postponed }`
- `resumeToPipeableStream`：Node 版 `resume`
- `resumeAndPrerender(stream, options)`：把 resume 的产物继续预渲染到完成（用于 "resume 后再缓存完整结果"）
- `resumeAndPrerenderToNodeStream`：Node 版

> 选择依据：Web Stream（Workers/Deno/Bun）还是 Node Stream。Next.js 等框架已封装，业务代码按框架约定调对应 hook/route handler。

## 6. 遗留 API（不推荐）

| API | 为什么不推荐 |
|-----|------------|
| `renderToString` | 无法流式、不支持 Suspense 边界外的延迟、性能差。仅遗留兼容。 |
| `renderToStaticMarkup` | 无 hydration 标记。仅纯静态站点遗留。 |

新项目一律用 `renderToPipeableStream` / `renderToReadableStream`，或框架封装。

## 7. 与其他 skill 的关系

- **Next.js App Router**：框架封装了上述 API，业务代码用 `loading.tsx`/`error.tsx`/route handler。见 [../nextjs/references/app-router.md](../nextjs/references/app-router.md)。
- **Server Components**：RSC 的流式序列化协议与 `renderToPipeableStream` 配合，由框架协调。见 [server-components.md](server-components.md)。
- **Suspense**：流式 SSR 的核心，shell 内外的 Suspense 边界决定流式行为。见 [concurrent-features.md](concurrent-features.md)。
- **TanStack Query SSR**：`dehydrate`/`HydrationBoundary` 在流式渲染中传递缓存。见 [../tanstack/references/query.md](../tanstack/references/query.md)。

## 8. 速查

| 需求 | API |
|------|-----|
| Node 流式 SSR | `renderToPipeableStream` |
| Workers/Deno/Bun 流式 SSR | `renderToReadableStream` |
| 设置状态码 | `onError` 设 `didError`，`onShellReady` 时定 status |
| 超时中止 | `abort()`（abort 后客户端降级） |
| 静态预渲染（可暂停） | `prerender`（Web）/ `prerenderToNodeStream`（Node） |
| 恢复暂停的渲染 | `resume`（Web）/ `resumeToPipeableStream`（Node） |
| resume 后继续预渲染完成 | `resumeAndPrerender` / `resumeAndPrerenderToNodeStream` |
| 爬虫/静态生成等全部就绪 | `onAllReady`（pipe）/ `await stream.allReady`（readable） |
| 遗留无 hydration 静态 | `renderToStaticMarkup`（不推荐） |
| 简单字符串 | `renderToString`（不推荐，无法流式） |
