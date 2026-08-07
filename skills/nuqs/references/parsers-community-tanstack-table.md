# TanStack Table 同步（社区）

> 面向 `nuqs@^2` + `@tanstack/react-table@^8`。把分页/筛选/排序存 URL，刷新不丢。TanStack Table 与 TanStack Router 的集成见 [../../tanstack/references/router.md](../../tanstack/references/router.md)；nuqs 基础见 [core.md](core.md)。

默认情况下 TanStack Table 状态存在内存，刷新丢失。nuqs 帮你把关键状态同步到 URL query string。

## 1. Pagination（分页）最常用模式

TS 存两个 key：
- `pageIndex`：**0 起**整数（TS 内部约定）
- `pageSize`：每页条数

UI 上通常希望 URL 是 **1 起**页码（如 `?page=1`）。nuqs 的 `parseAsIndex` 专门做这个 +1 偏移转换。

```ts
// search-params.pagination.ts
import { parseAsIndex, parseAsInteger, useQueryStates } from 'nuqs'

const paginationParsers = {
  pageIndex: parseAsIndex.withDefault(0),   // URL 1-based → TS 内部 0-based
  pageSize:  parseAsInteger.withDefault(10),
}

const paginationUrlKeys = {
  pageIndex: 'page',     // 代码用语义化名，URL 用短名
  pageSize:  'perPage',
}

export function usePaginationSearchParams() {
  return useQueryStates(paginationParsers, { urlKeys: paginationUrlKeys })
}
```

URL 例：`?page=1&perPage=10`
内部 state：`{ pageIndex: 0, pageSize: 10 }`

### 接进 TanStack Table

```tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { usePaginationSearchParams } from './search-params.pagination'

export function DataTable({ data, columns }) {
  const [{ pageIndex, pageSize }, setPagination] = usePaginationSearchParams()

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(data.length / pageSize),
    state: { pagination: { pageIndex, pageSize } },
    onPaginationChange: updater => {
      // updater 可以是值或函数：(prev => next)
      setPagination(prev =>
        typeof updater === 'function' ? updater(prev) : updater,
      )
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // 若用服务端取数
  })

  // 渲染 table UI（table.getRowModel() / pageination controls）
}
```

## 2. Filtering（筛选）— 推荐模式

官方文档 filtering 一节为空（TODO），这里给与 TS 状态对齐的最佳实践。

### 全局文本搜索（单键）

```ts
const [{ global, pageIndex, pageSize }, set] = useQueryStates({
  global:     parseAsString.withDefault(''),
  pageIndex:  parseAsIndex.withDefault(0),
  pageSize:   parseAsInteger.withDefault(10),
})

const table = useReactTable({
  // ...
  state: {
    globalFilter: global,
    pagination: { pageIndex, pageSize },
  },
  onGlobalFilterChange: f => set(s => ({ ...s, global: typeof f === 'function' ? f(s.global) : f })),
})
```

### Column Filters（多列，JSON 模式）

`columnFilters: { id: string, value: unknown }[]` 结构，推荐用 `parseAsJson`（URL 上放 JSON 字符串），短键 `cf`：

```ts
import { parseAsIndex, parseAsInteger, parseAsJson, useQueryStates } from 'nuqs'

type ColumnFilter = { id: string; value: unknown }

const parsers = {
  pageIndex: parseAsIndex.withDefault(0),
  pageSize:  parseAsInteger.withDefault(10),
  cf:        parseAsJson<ColumnFilter[]>().withDefault([]),  // column filters
}
const urlKeys = { pageIndex: 'page', pageSize: 'perPage' }

export function useTableSearchParams() {
  return useQueryStates(parsers, { urlKeys })
}
```

> `parseAsJson` 的结果类型为 `unknown` 时，**v2 要求提供运行时校验才能 infer 类型**（见 [migration-v2.md](migration-v2.md) 的 type changes）。推荐用 Zod codecs 做 JSON + 校验：见 [parsers-community-zod.md](parsers-community-zod.md)，封装一次搞定反序列化与形状校验。

## 3. Sorting（排序）— 推荐模式

官方 sorting 一节为空。TS 的 `sorting: { id: string; desc: boolean }[]` 与 columnFilters 同样是数组对象，方案一致：

- 简单：`parseAsJson<SortingState>().withDefault([])`，短键 `sort`。
- 健壮：Zod codec（schema `z.array(z.object({ id: z.string(), desc: z.boolean() }))`）。

```ts
// 简单方案
const [{ sorting }, set] = useQueryStates({
  sorting: parseAsJson<{ id: string; desc: boolean }[]>().withDefault([]),
}, { urlKeys: { sorting: 'sort' } })

table.setOptions({
  state: { sorting },
  onSortingChange: updater =>
    set(s => ({
      sorting: typeof updater === 'function' ? updater(s.sorting) : updater,
    })),
})
```

## 4. 注意事项

| 坑 | 说明 |
|----|------|
| URL 长度 | JSON 数组多起来易超 2000 字符。筛选字段多→只把「可分享的关键筛选」放 URL，其余存内存/Context/LocalStorage |
| `manual*: true` | 服务端取数必须 `manualPagination/manualFiltering/manualSorting` 让 TS 不做前端处理 |
| `parseAsIndex` 偏移 | 必须配 `urlKeys` 时仍生效——内部 pageIndex 是 0-based，URL 映射成 `page=1` |
| 筛选变化回到首页 | onFilterChange 里把 `pageIndex` 一起重置为默认（同 `useQueryStates` 批量） |

### 筛选变化回到首页（重要 UX）

```ts
onColumnFiltersChange: updater =>
  set(s => {
    const next = typeof updater === 'function' ? updater(s.cf) : updater
    return { ...s, cf: next, pageIndex: 0 }  // reset to page 1 in URL
  }),
```

用 `useQueryStates` 批量合并后是一次 URL 更新。

## 5. 速查

| 需求 | 做法 |
|------|------|
| 分页（1-based URL） | `parseAsIndex` + `urlKeys.page = 'page'` |
| 每页条数 | `parseAsInteger.withDefault(10)` |
| 全局搜索 | `parseAsString.withDefault('')` + `globalFilter` |
| Column Filters / Sorting（简单） | `parseAsJson<T>().withDefault([])` + 短键 |
| Column Filters / Sorting（校验） | Zod codecs 适配器见 [parsers-community-zod.md](parsers-community-zod.md) |
| 筛选变化回首页 | 批量 `set(...)` 把 pageIndex 置 0 |
| URL 过长 | 只放可分享的关键筛选，其余放内存 |
