# Utilities

> 面向 `nuqs@^2`。工具函数可从 `nuqs` 或 `nuqs/server` 导入（后者不含 `"use client"`，SSR 友好）。版本标注如下文。

## 1. `createSerializer` — 生成 `<Link>` 用的 query string（v1.16+）

面向 parser 描述对象，生成一个序列化函数。输出的 query string 与 hooks 行为完全一致（默认值剔除、null 移除、`urlKeys` 重映射），适合生成 `<Link>` 的 `href`。

```ts
import {
  createSerializer,
  parseAsInteger,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'  // client 从 'nuqs' 也行

const searchParams = {
  search: parseAsString,
  limit: parseAsInteger,
  from: parseAsIsoDateTime,
  to: parseAsIsoDateTime,
  sortBy: parseAsStringLiteral(['asc', 'desc']),
}

// 1. 用描述对象生成 serializer
const serialize = createSerializer(searchParams)

// 2. 调用（值可为子集；null 不入 URL；默认值按 clearOnDefault= true 不入）
serialize({
  search: 'foo bar',
  limit: 10,
  from: new Date('2024-01-01'),
  // `to` 省略 → 不出现在 URL
  sortBy: null,  // null → 也不出现在 URL
})
// ?search=foo+bar&limit=10&from=2024-01-01T00:00:00.000Z
```

### Base 参数：在现有 URL 基础上追加/修改

第一个参数可传基础 URL/字符串/URLSearchParams，serializer 在基础上合并或按 null 移除：

```ts
serialize('/path?baz=qux', { foo: 'bar' })
// → /path?baz=qux&foo=bar

serialize(new URLSearchParams('?baz=qux'), { foo: 'bar' })
// → ?baz=qux&foo=bar

serialize('?remove=me', { foo: 'bar', remove: null })  // null 移除已有
// → ?foo=bar
```

### `urlKeys`：短 URL 键（与 `useQueryStates` 一致）

```ts
const serialize = createSerializer(
  { latitude: parseAsFloat, longitude: parseAsFloat, zoomLevel: parseAsInteger },
  { urlKeys: { latitude: 'lat', longitude: 'lng', zoomLevel: 'z' } },
)

serialize({ latitude: 45.18, longitude: 5.72, zoomLevel: 12 })
// → ?lat=45.18&lng=5.72&z=12
```

### `processUrlSearchParams`：中间件（v2.6+）

与 `<NuqsAdapter>` 的同名选项一致，序列化前改 `URLSearchParams`（原地改或返回副本均可）。常用于 SEO 的 canonical URL 字母序：

```ts
const serialize = createSerializer(
  { a: parseAsInteger, z: parseAsInteger },
  {
    processUrlSearchParams: search => {
      search.sort()
      return search
    },
  },
)

serialize('?foo=bar', { a: 1, z: 1 })
// → ?a=1&foo=bar&z=1（先合并、再排序）
```

### 典型用法：渲染 `<Link>`

```tsx
import Link from 'next/link'
import { createSerializer, parseAsInteger } from 'nuqs/server'

const ser = createSerializer({ page: parseAsInteger })

function PageNav() {
  return (
    <>
      <Link href={`/items${ser({ page: 1 })}`}>First</Link>
      <Link href={`/items${ser({ page: currentPage - 1 })}`}>Prev</Link>
    </>
  )
}
```

Server Component 里可安全导入 `createSerializer`（`nuqs/server`，无 client 指令）。

## 2. `inferParserType` — 从 parser 推断值类型（v1.18+）

直接拿 parser / parser 对象描述最终值的 TS 类型，不用手动声明 state 接口。

```ts
import { parseAsInteger, parseAsBoolean, type inferParserType } from 'nuqs'

// 单个 parser
const intNullable = parseAsInteger
const intNonNull = parseAsInteger.withDefault(0)

type A = inferParserType<typeof intNullable>   // number | null
type B = inferParserType<typeof intNonNull>    // number

// parser 对象描述（useQueryStates / createLoader 同形）
const parsers = {
  a: parseAsInteger,
  b: parseAsBoolean.withDefault(false),
}
type S = inferParserType<typeof parsers>
// { a: number | null, b: boolean }
```

场景：定义一次 parser 描述，复用 loader / hooks / serialize 与 state 类型，端到端不写重复接口。与 [server-side.md](server-side.md) 的「共享 parser 声明」模式对齐。

## 3. Standard Schema 兼容（v2.5+）

把 nuqs 的 parser 定义转成 [Standard Schema v1](https://standardschema.dev/)，拿去给 tRPC / TanStack Router / 其他工具复用类型与校验。

```ts
import {
  createStandardSchemaV1,
  parseAsInteger,
  parseAsString,
} from 'nuqs/server'

// 1. 照常定义 search params
export const searchParams = {
  searchTerm: parseAsString.withDefault(''),
  maxResults: parseAsInteger.withDefault(10),
}

// 2. 转成 Standard Schema validator
export const validateSearchParams = createStandardSchemaV1(searchParams)

// 3. 喂给 tRPC（procedures.input 接受任何 Standard Schema）
router({
  search: publicProcedure.input(validateSearchParams).query(...),
})
```

### 接 TanStack Router `validateSearch`

**关键**：nuqs 有默认值回退，而 TanStack Router 默认假设 validateSearch 的输出含全部键。为了让「nuqs 输出可为空」匹配 TSR 的类型，需 `partialOutput: true`：

```tsx
import { createStandardSchemaV1 } from 'nuqs'
import { createFileRoute } from '@tanstack/react-router'

const validateSearch = createStandardSchemaV1(searchParams, {
  partialOutput: true,  // 让 TSR 的 search 类型与 nuqs 兼容
})

export const Route = createFileRoute('/search')({ validateSearch })
```

> TanStack Router 支持是**实验性**：仅简单类型（string/enum/literal/number/boolean/JSON）支持类型安全 linking；`urlKeys` 不支持。见 nuqs adapters 文档与 [core.md](core.md)。

## 4. 速查

| 需求 | 选择 |
|------|------|
| `<Link>` 生成一致的 query string | `createSerializer`（server + client） |
| 在已有 URL 上改 query | `serialize(base, updates)` + null 移除 |
| 与 `useQueryStates` 相同的短键映射 | 传 `urlKeys` 选项 |
| SEO canonical 字母序稳定 | `processUrlSearchParams: sp => { sp.sort(); return sp }` |
| 拿 parser 值类型 | `type T = inferParserType<typeof parser>` |
| 拿 parser 对象的 state 类型 | `inferParserType<typeof parsers>`（与 loader/hook 返回同形） |
| 接 tRPC 输入校验 | `createStandardSchemaV1(parsers)` → `procedure.input(...)` |
| 接 TanStack Router `validateSearch` | `partialOutput: true` + Standard Schema（实验） |
