# Core API & Parsers

> 面向 `nuqs@^2`。前提：已用对应框架的 `NuqsAdapter` 包裹应用（见 [SKILL.md](../SKILL.md)）。选项细节见 [options.md](options.md)；服务端见 [server-side.md](server-side.md)。

## `useQueryState` — 单键，像 `useState`

```tsx
import { useQueryState, parseAsInteger } from 'nuqs'

function Counter() {
  const [count, setCount] = useQueryState('count', parseAsInteger.withDefault(0))
  // count: number（有默认值则非空）
  return (
    <>
      <pre>{count}</pre>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={() => setCount(null)}>Clear</button>
    </>
  )
}
```

| URL | 值 | 说明 |
|-----|----|------|
| `/` | `null`（或默认值） | 无 key |
| `/?count=` | `''`（string 默认） | 空串 |
| `/?count=2` | `2`（parser 决定类型） | |
| `/?count=banana` | 默认值 | 非法值回退默认（不抛错） |

要点：
- 设 `null` → 从 URL 移除该 key。
- 无默认值时类型为 `T | null`；`.withDefault(x)` 后类型为 `T`。
- 默认值是 React 内部的，**不写入 URL**（除非显式设且配 `clearOnDefault: false`，见 [options.md](options.md)）。

## `useQueryStates` — 多键批量

应一起动的键用 `useQueryStates`，一次 URL 更新：

```tsx
import { useQueryStates, parseAsFloat } from 'nuqs'

const [{ lat, lng }, setCoordinates] = useQueryStates({
  lat: parseAsFloat.withDefault(45.18),
  lng: parseAsFloat.withDefault(5.72),
}, { history: 'push' })

// 一次更新（不是两次 URL 写入）
await setCoordinates({ lat: 42, lng: 12 })

// 清掉本 hook 管理的所有 key，其他 search params 不动
setCoordinates(null)
```

### 批处理与 Promise

同一事件循环 tick 内多次 `setState`（任意 hook）会合并为**一次** URL 写入。`setState` 返回 `Promise<URLSearchParams>`，可 await 等落定：

```ts
const search = await setCoordinates({ lat: 42, lng: 12 })
search.get('lat') // '42'
```

Promise 在下次 flush 前被缓存——同 tick 内所有 `setState` 拿到同一 Promise 引用。被节流时可能跨多个 tick 才 flush，期间后续 `setState` 会覆盖前值，并非每次都反映到 URL。**React state 永远即时更新**，只有 URL 写入被节流。

### 选项优先级

三处可设选项，优先级高 → 低：

1. call-level（`setState(v, opts)`）
2. parser（`parseAsFloat.withOptions({ shallow: false })`）
3. hook 全局（`useQueryStates(parsers, { history: 'push' })`）

### `urlKeys` — 短 URL 键（v2.3+）

代码用语义化长名，URL 用短键；TanStack Router 不支持。

```tsx
const [{ latitude, longitude }, setCoordinates] = useQueryStates(
  { latitude: parseAsFloat.withDefault(45.18), longitude: parseAsFloat.withDefault(5.72) },
  { urlKeys: { latitude: 'lat', longitude: 'lng' } },
)
// setCoordinates({ latitude: 1, longitude: 2 }) → ?lat=1&lng=2
```

跨文件复用时用类型助手：

```ts
import { type UrlKeys } from 'nuqs' // 或 'nuqs/server'
export const coordsParsers = { latitude: parseAsFloat.withDefault(45.18) }
export const coordsUrlKeys: UrlKeys<typeof coordsParsers> = { latitude: 'lat' }
```

## Parsers

内置（`nuqs` 顶层导出）：

| Parser | 类型 | 说明 |
|--------|------|------|
| `parseAsString` | `string` | **noop 不校验**，要限定值集用 enum/literal |
| `parseAsInteger` | `number` | `parseInt(_, 10)` |
| `parseAsFloat` | `number` | `parseFloat` |
| `parseAsHex` | `number` | 十六进制 |
| `parseAsIndex` | `number` | 整数 +1 偏移，分页用（URL 显示 1，代码 0） |
| `parseAsBoolean` | `boolean` | |
| `parseAsTimestamp` | `Date` | 毫秒时间戳 |
| `parseAsIsoDateTime` | `Date` | ISO 8601 |
| `parseAsJson` | `T` | JSON 解析（注意 URL 长度限制） |
| `parseAsJsonString` | `string` | 仅校验是合法 JSON 字符串 |
| `parseArrayOf(parser)` | `T[]` | 数组 |
| `parseAsEnum` | 联合 | 枚举值集 |
| `parseAsLiteral` | 字面量 | 限定具体值 |

builder 链式：`.withDefault(x).withOptions({ shallow: false, history: 'push' })`。

> `parseAsString` 不做任何校验。需要 `'foo' | 'bar'` 这类运行时安全，用 `parseAsEnum(['foo','bar'])` 或 `parseAsLiteral(['foo','bar'] as const)`。

## 自定义 parser

```ts
import { createParser } from 'nuqs'

const dateParser = createParser({
  parse: (value: string) => new Date(value.slice(0, 10)),
  serialize: (date: Date) => date.toISOString().slice(0, 10),
  eq: (a: Date, b: Date) => a.getTime() === b.getTime(), // clearOnDefault 需要
})
```

约束：
- `parse` / `serialize` / `eq` 必须是纯函数。
- **必须双射**：`parse(serialize(x)) === x` 且 `serialize(parse(x)) === x`。双射测试见 [testing.md](testing.md)。
- 值类型不能用 `===` 比较时（如 Date、对象），必须提供 `eq`，否则 `clearOnDefault` 行为错乱。

社区适配器：Zod codecs、Effect Schema、TanStack Table（见官方文档 community parsers）。

## 复用模式：封装自定义 hook

同 key 的多个 `useQueryState(s)` 自动同步。复用 parser 配置就封装成 hook：

```ts
// hooks/useCoordinates.ts
'use client'
import { useQueryStates, parseAsFloat } from 'nuqs'

export function useCoordinates() {
  return useQueryStates({
    lat: parseAsFloat.withDefault(0),
    lng: parseAsFloat.withDefault(0),
  })
}
```

```tsx
// 读和写分开在两个组件，仍同步
function MapView() {
  const [{ lat, lng }] = useCoordinates()       // 只读
  return <span>{lat},{lng}</span>
}
function MapControls() {
  const [, set] = useCoordinates()
  return <input onChange={e => set({ lat: e.target.valueAsNumber })} />
}
```

## 速查

| 需求 | 选择 |
|------|------|
| 单个 URL 值 | `useQueryState` |
| 多个值一起动 | `useQueryStates` |
| 等 URL 落定 | `await setState(...)` |
| 短 URL 键 | `urlKeys`（非 TanStack Router） |
| 非 string 类型 | `parseAs*` parser |
| 自定义类型 | `createParser`（必须双射） |
| 跨组件同步 | 封装自定义 hook，同 key 自动同步 |
