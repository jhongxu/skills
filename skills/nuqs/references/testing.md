# Testing

> 面向 `nuqs@^2`。v2 起用专用测试适配器，**无需 mock** 任何路由框架。parser 基础见 [core.md](core.md)。

## `NuqsTestingAdapter` / `withNuqsTestingAdapter`

从 `nuqs/adapters/testing` 导入。`withNuqsTestingAdapter` 是返回 wrapper 组件的工厂，配合 RTL 的 `render` / `renderHook` 用：

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { withNuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing'
import { vi } from 'vitest'
import { CounterButton } from './counter-button'

it('increments count on click', async () => {
  const user = userEvent.setup()
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()

  render(<CounterButton />, {
    wrapper: withNuqsTestingAdapter({ searchParams: '?count=42', onUrlUpdate }),
  })

  await user.click(screen.getByRole('button'))

  expect(screen.getByRole('button')).toHaveTextContent('count is 43')
  expect(onUrlUpdate).toHaveBeenCalledOnce()
  const event = onUrlUpdate.mock.calls[0]![0]!
  expect(event.queryString).toBe('?count=43')
  expect(event.searchParams.get('count')).toBe('43')
})
```

> Vitest v1 用 `vi.fn<[UrlUpdateEvent]>()`（类型参数传事件类型）；v2 用 `vi.fn<OnUrlUpdateFunction>()`（传函数类型）。

### `renderHook` 用法

```tsx
import { renderHook } from '@testing-library/react'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'

const { result } = renderHook(() => useMyHook(), {
  wrapper: withNuqsTestingAdapter({ searchParams: { count: '42' } }),
})
```

`searchParams` 接受 query 字符串 / `URLSearchParams` / 字符串 record（值是序列化后的字符串）。

### API 参数

| 参数 | 作用 |
|------|------|
| `searchParams` | 初始 search params（字符串 / `URLSearchParams` / record） |
| `onUrlUpdate` | URL 更新回调，收 `{ searchParams, queryString, options }` 用于断言 |
| `hasMemory` | 默认 `false`（immutable，每次基于初始值）；`true` 则更新累积，像生产适配器 |
| `rateLimitFactor` | 默认禁用节流；设 `1` 启用与生产一致的节流 |
| `resetUrlUpdateQueueOnMount` | 默认 `true`（mount 前清队列，隔离测试）；`false` 保留队列贴近生产行为 |

### 直接用组件形式

```tsx
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'

<NuqsTestingAdapter searchParams="?q=hi">
  <ComponentUsingNuqs />
</NuqsTestingAdapter>
```

## Jest 与 ESM

nuqs 2 是 ESM-only。Jest 需额外配置：

```ts
// jest.config.ts
const config: Config = {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {},
}
```

```json
// package.json
{
  "scripts": {
    "test": "NODE_OPTIONS=\"$NODE_OPTIONS --experimental-vm-modules\" jest"
  }
}
```

> Windows 用 `cross-env` 处理环境变量。

## 自定义 parser 双射测试（v2.4+）

自定义 parser 必须双射（见 [core.md](core.md)）。`nuqs/testing` 提供助手：

```ts
import {
  isParserBijective,
  testParseThenSerialize,
  testSerializeThenParse,
} from 'nuqs/testing'

it('is bijective', () => {
  expect(isParserBijective(parseAsInteger, '42', 42)).toBe(true)
  expect(() => isParserBijective(parseAsInteger, '42', 47)).toThrowError()

  // 单独测某一侧
  expect(testParseThenSerialize(parseAsInteger, '42')).toBe(true)
  expect(testSerializeThenParse(parseAsInteger, 42)).toBe(true)

  expect(() => testParseThenSerialize(parseAsInteger, 'not a number')).toThrowError()
  expect(() => testSerializeThenParse(parseAsInteger, NaN)).toThrowError()
})
```

- `isParserBijective(parser, serialized, value)`：往返都测，失败抛错。
- `testParseThenSerialize(parser, str)` / `testSerializeThenParse(parser, value)`：测单侧，失败抛错便于定位。

## 速查

| 需求 | 选择 |
|------|------|
| 测用 nuqs 的组件 | `withNuqsTestingAdapter` wrapper，无需 mock |
| 断言 URL 变化 | `onUrlUpdate` 回调读 `queryString` / `searchParams` |
| 跨多次更新累积 | `hasMemory: true` |
| 测 hook | `renderHook` + `withNuqsTestingAdapter` |
| Jest | ESM 配置 + `--experimental-vm-modules` |
| 自定义 parser | `isParserBijective` / 单侧测试 |
