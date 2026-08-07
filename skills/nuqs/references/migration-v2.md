# v1 → v2 迁移

> `nuqs@2` 的 breaking changes 摘要。按项目实际检查：适配 **Adapter 包裹**（最大改动）、`shallow:false` 与 `startTransition` 分开、`nuqs/parsers` → `nuqs/server`、弃用项清理。

## 0. 概览（官方的 8 条 breaking changes）

1. **Adapters**：必须用对应框架的 `NuqsAdapter` 包裹应用（v1 只支持 Next.js，无需包裹）。
2. **行为变更**：`startTransition` 不再自动开 `shallow: false`。
3. **ESM-only**：不再出 CJS 包。
4. **弃用项已移除**：`queryTypes` 对象、`subscribeToQueryUpdates`。
5. **`nuqs/parsers` 改为 `nuqs/server`**（含更多服务端专属 API）。
6. **Debug 标记**：`localStorage.debug` 里 `next-usequerystate` 改名 `nuqs`。
7. **停止 `next-usequerystate` 别名包**。
8. **类型变更**：`parseAsJson` 新要求运行时校验、`Options` 非泛型、`UseQueryStatesOptions` 变泛型 type。

下面逐条给迁移代码。

## 1. Adapters — 必须加 `NuqsAdapter` 包裹

### Next.js（≥ 14.2.0）

**App Router**：

```tsx
// src/app/layout.tsx
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { type ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  )
}
```

**Pages Router**：

```tsx
// src/pages/_app.tsx
import type { AppProps } from 'next/app'
import { NuqsAdapter } from 'nuqs/adapters/next/pages'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <NuqsAdapter>
      <Component {...pageProps} />
    </NuqsAdapter>
  )
}
```

**双路由混合（代价 +~100B）**：

```tsx
import { NuqsAdapter } from 'nuqs/adapters/next'
```

### 其他框架 / 测试

- React SPA (Vite)：`nuqs/adapters/react`
- React Router v6/v7/v8：`nuqs/adapters/react-router/v{6,7,8}`
- Remix：`nuqs/adapters/remix`（**v3 移除**）
- 测试：`nuqs/adapters/testing`（`NuqsTestingAdapter`/`withNuqsTestingAdapter`，见 [testing.md](testing.md)）
- TanStack Router：`nuqs/adapters/tanstack-router`（实验性）

## 2. 行为变更：`startTransition` ⫋ `shallow: false`

v1：只要设了 `startTransition`，自动开 `shallow: false`（发请求给服务端）。
v2：完全独立；要保留原来行为，**两处都要显式设置**：

```ts
- useQueryState('q', { startTransition })
+ useQueryState('q', { startTransition, shallow: false })
```

这是 v2 最常出的静默 bug：RSC loader 不刷新了。症状："我切了 search param，但 Server Component 里拿到的还是旧值"——先检查有没有补 `shallow: false`。

另外：`import {} from 'nuqs'`（client 入口）在 v2 里自带 `"use client"` 指令，**服务端代码要一律改 `nuqs/server`**，否则会报错：

```
Error: Attempted to call withDefault() from the server
  but withDefault is on the client.
```

## 3. ESM-only

`nuqs@2` 是纯 ESM 包。症状：

```
[ERR_REQUIRE_ESM]: require() of ES Module not supported
```

解法：
- 应用层（Next.js）：用 `import`，不需要管（Next ≥ 12 支持 ESM）。
- 中间库如果你需要出 CJS，要么把库整体转 ESM，要么动态 `import('nuqs')`：

```ts
const { useQueryState } = await import('nuqs')
```

## 4. 弃用移除项

### 4.1 `queryTypes` 对象 → `parseAsXxx` 命名导出

v1 标记弃用于 2023-09，v2 已移除，目的是做 tree-shaking。

```ts
- import { queryTypes } from 'nuqs'
+ import { parseAsString, parseAsInteger, /* ... */ } from 'nuqs'

- useQueryState('q', queryTypes.string.withOptions({ ... }))
- useQueryState('page', queryTypes.integer.withDefault(1))
+ useQueryState('q', parseAsString.withOptions({ ... }))
+ useQueryState('page', parseAsInteger.withDefault(1))
```

映射关系：

| v1 `queryTypes.` | v2 `parseAs…` |
|------------------|---------------|
| `string` | `parseAsString` |
| `integer` | `parseAsInteger` |
| `float` | `parseAsFloat` |
| `boolean` | `parseAsBoolean` |
| `timestamp` | `parseAsTimestamp` |
| `isoDateTime` | `parseAsIsoDateTime` |
| `json` | `parseAsJson<T>()`（需提供运行时校验） |
| `literalOf` | `parseAsLiteral` |
| `enumOf` | `parseAsEnum` |
| `arrayOf` | `parseArrayOf(innerParser)` |

### 4.2 `subscribeToQueryUpdates` 已移除

Next.js 14.1.0 的 `useSearchParams` 已能响应 shallow updates，这个 helper 不再需要。如果你之前用它监听全局 query 变化做跨组件通知，现在改为：每个组件各自的 `useQueryState(s)` 会自动同步，或者用自定义 `useQueryStates` 封装共享 hook（见 [core.md](core.md) 的「封装自定义 hook」）。

## 5. `nuqs/parsers` → `nuqs/server`

```ts
- import { parseAsInteger, createSearchParamsCache } from 'nuqs/parsers'
+ import { parseAsInteger, createSearchParamsCache } from 'nuqs/server'
```

因为新增了服务端功能（`createLoader`/`createSearchParamsCache`/`createSerializer`/`inferParserType`/`createStandardSchemaV1`），不只是 parsers。**全局 find+replace 即可**。

## 6. Debug 打印：`next-usequerystate` → `nuqs`

在 devtools 控制台执行一次：

```js
if (localStorage.debug) {
  localStorage.debug = localStorage.debug.replace('next-usequerystate', 'nuqs')
}
```

否则调试日志开关不再生效（v2 只认 `nuqs` 子串）。

## 7. 停止 `next-usequerystate` 别名

Package started as `next-usequerystate`，2024-01 改名 `nuqs`。v2 后不再同步别名。迁移：

```bash
pnpm remove next-usequerystate
pnpm add nuqs
```

```ts
- import { useQueryState } from 'next-usequerystate'
+ import { useQueryState } from 'nuqs'
```

## 8. 类型变更（仅影响类型层）

| 类型 | v1 | v2 |
|------|----|----|
| `Options` | 泛型（`Options<T>`） | 非泛型，用法变简 |
| `UseQueryStatesOptions` | interface | `type`，泛型 **over** 传入的 parsers 对象 |
| `parseAsJson<T>()` | 直接 infer `T` | **必须**提供运行时校验 → 用 Zod/Effect Schema 自定义 parser（见 [parsers-community-zod.md](parsers-community-zod.md)） |

**`parseAsJson` 典型修复**：

```ts
- parseAsJson<MyStruct>().withDefault(...)   // v1：靠泛型，无运行时校验
+ createZodCodecParser(jsonCodec(myStruct)).withDefault(...) // v2：运行时 + 类型一并有
```

如果你真的不想加校验，可用 `parseAsJsonString`（保证是合法 JSON 字符串，不保证形状）。

## 9. Checklist

升级完成请逐条确认：

- [ ] 根 layout / `_app` / 入口里用对应 router 的 `NuqsAdapter` 包裹
- [ ] Next.js 版本 ≥ 14.2
- [ ] 所有 `import from 'nuqs/parsers'` 改为 `from 'nuqs/server'`
- [ ] 所有服务端 `import from 'nuqs'` 改为 `from 'nuqs/server'`
- [ ] `startTransition` + `shallow: false` 同时显式写（需要服务端重渲染时）
- [ ] 移除所有 `queryTypes.` 用法，改为 `parseAsXxx`
- [ ] `parseAsJson<T>()` 全替换为 Zod / Effect schema 的自定义 parser（提供校验）
- [ ] 没有 `subscribeToQueryUpdates` 遗留
- [ ] 中间库出 CJS 时用 `await import('nuqs')` 或转 ESM
- [ ] 测试里用 `NuqsTestingAdapter` 替代 Next.js router mock
