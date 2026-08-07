# Options & Rate limiting

> 面向 `nuqs@^2`。API 基础见 [core.md](core.md)。所有选项均可通过 builder / hook / call-level 三处传递，优先级：call-level > parser > hook 全局。

## 默认行为

不配置时 nuqs：
1. **client-only**（`shallow: true`，不发服务端请求）
2. **replace** 当前历史项（不入栈）
3. **不滚动**到顶部
4. 按浏览器节流（默认 50ms，Safari 120ms）

## 传递选项

```ts
// 1. builder（hook 级）
const [s, setS] = useQueryState('foo', parseAsString.withOptions({ history: 'push' }))

// 2. call-level（覆盖 hook 级）
setS('bar', { scroll: true })
```

## history — `replace`（默认）| `push`

`push` 每次更新入历史栈，可用 Back 回退（适合 tab/modal 等导航式状态）：

```ts
useQueryState('tab', parseAsString.withOptions({ history: 'push' }))
```

> **别全局开 `push`**——每个 search param 更新都入栈会污染 Back 体验。仅 per-hook/per-call 在导航式状态上用。

## shallow — `true`（默认）| `false`

`shallow: true`（默认）：client-first，不发服务端请求。
`shallow: false`：通知服务端重渲染。

```ts
useQueryState('q', parseAsString.withOptions({ shallow: false }))
```

`shallow: false` 仅在可 SSR 的框架有意义；**React SPA 无效**。配对：
- Next.js App Router：page 的 `searchParams` prop
- Next.js Pages Router：`getServerSideProps`
- Remix / React Router：`loader`

React Router 系框架里，nuqs 通过 patch history 方法实现 shallow（默认不跑 loader）；需要读 shallow 更新的 search params 时用 `useOptimisticSearchParams`（`nuqs/adapters/remix` 或 `…/react-router/v{6,7,8}`），原生 `useSearchParams` 不反映 shallow 更新。

## scroll — `true` | `false`（默认）

```ts
setS('bar', { scroll: true })   // 更新后滚到顶部
```

## clearOnDefault — `true`（v2 默认）| `false`

状态等于默认值时从 URL 移除 key（保持 URL 干净）。默认值**可能变化**时（如分页大小未来调整）设 `false` 保留 URL 语义：

```ts
useQueryState('search', { defaultValue: '', clearOnDefault: false })
```

比较用 `===` 引用相等；自定义 parser 的非 `===` 类型（Date/对象）必须提供 `eq`（见 [core.md](core.md) 的自定义 parser），否则 `clearOnDefault` 错乱。

> 任何时候都能用 `setState(null)` 显式清除 key，不受 `clearOnDefault` 影响。

## limitUrlUpdates — 节流 / 防抖

```ts
import { throttle, debounce, defaultRateLimit } from 'nuqs'

useQueryState('foo', {
  shallow: false,
  limitUrlUpdates: throttle(1000),   // 或 { method: 'throttle', timeMs: 1000 }
})

// call-level 覆盖
setS('bar', { limitUrlUpdates: debounce(500) })
// 重置回默认
setS('baz', { limitUrlUpdates: defaultRateLimit })
```

**throttle vs debounce**：

| | 行为 | 适用 |
|---|------|------|
| `throttle(ms)` | 立即发，再定期批 | 低频更新（默认） |
| `debounce(ms)` | 推迟到停顿后发，只保终值 | 高频更新（搜索框/滑块），只关心最终值 |

要点：
- **hook 返回的 state 永远即时更新**，只有 URL 写入 / 服务端请求被节流或防抖。
- 多 hook 同 tick 设不同值，取**最大**值。
- `< 50ms` 被忽略（避免浏览器 rate-limit）。
- `timeMs: +Infinity` 禁用 URL/服务端更新，但 hook 间仍同步。

> `throttleMs` 在 v2.5.0 **弃用**，迁到 `limitUrlUpdates: throttle(ms)`。

### debounce 经典场景：搜索框

清空/回车立即发，打字防抖：

```tsx
import { useQueryState, parseAsString, debounce } from 'nuqs'

function Search() {
  const [q, setQ] = useQueryState('q', parseAsString.withDefault('').withOptions({ shallow: false }))
  return (
    <input
      value={q}
      onChange={e => setQ(e.target.value, {
        limitUrlUpdates: e.target.value === '' ? undefined : debounce(500),
      })}
      onKeyDown={e => { if (e.key === 'Enter') setQ(q) }}
    />
  )
}
```

> **客户端取数**（如 TanStack Query）保持 `shallow: true`，去 debounce hook 返回值（用第三方 `useDebounce`），不要 debounce URL。debounce URL 仅用于**服务端取数**（RSC/loader + `shallow:false`）控制请求时机。

## startTransition — RSC 重渲染 loading 态

配 `shallow: false`，把 React `useTransition` 的 `startTransition` 传入，在服务端重渲染 RSC 流式期间拿到 `isLoading`：

```tsx
'use client'
import React from 'react'
import { useQueryState, parseAsString } from 'nuqs'

function Filter({ data }: { data: Result[] }) {
  const [isLoading, startTransition] = React.useTransition()
  const [query, setQuery] = useQueryState(
    'query',
    parseAsString.withOptions({ startTransition, shallow: false }),
  )
  if (isLoading) return <div>Loading…</div>
  return <Results query={query} data={data} />
}
```

> v2 不再因传 `startTransition` 自动设 `shallow: false`（v1 行为），需显式。React Router v7+ data router 里 `navigate()` 返回 Promise，`isLoading` 覆盖到 loader 完成（需 React 19）；声明式/v6/Remix 的 `navigate()` 不报告完成，用 `useNavigation` 跟踪 loader。

## 全局默认 — `defaultOptions`（v2.5+）

```tsx
<NuqsAdapter
  defaultOptions={{
    history: 'push',
    shallow: false,
    scroll: true,
    clearOnDefault: false,
    limitUrlUpdates: throttle(250),
  }}
>
  {children}
</NuqsAdapter>
```

> 全局 `history: 'push'` 会污染 Back 历史，慎用——优先 per-hook/per-call。

## URL 写入中间件 — `processUrlSearchParams`（v2.6+）

在 `URLSearchParams` 合并后、写入 URL 前调用，可原地改或返回副本：

```tsx
// 按字母序排序 query
<NuqsAdapter
  processUrlSearchParams={search => { search.sort(); return search }}
>

// 加时间戳
<NuqsAdapter
  processUrlSearchParams={search => { search.set('ts', Date.now().toString()); return search }}
>
```

## 速查

| 需求 | 选项 |
|------|------|
| Back 按钮回退状态 | `history: 'push'`（per-hook，慎全局） |
| 通知服务端重渲染 | `shallow: false`（配 loader/RSC） |
| 更新后滚顶 | `scroll: true` |
| 默认值不入 URL | `clearOnDefault: true`（v2 默认） |
| 高频输入控制请求 | `limitUrlUpdates: debounce(ms)`（仅服务端取数） |
| 低频更新节流 | `limitUrlUpdates: throttle(ms)` |
| RSC 重渲染 loading | `startTransition` + `shallow: false` |
| 全站默认 | `<NuqsAdapter defaultOptions={...}>` |
| URL 写入前处理 | `processUrlSearchParams` |
