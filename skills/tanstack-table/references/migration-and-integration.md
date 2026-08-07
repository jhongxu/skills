# v8→v9 迁移与集成

> 面向从 `@tanstack/react-table@8` 迁移到 `@9`，以及与其它 TanStack 库 / nuqs / 虚拟化的集成。版本敏感，以下来自官方文档核对。

## 1. v8 → v9 Breaking Changes

| v8 | v9 | 说明 |
|----|-----|------|
| `useReactTable(options)` | `useTable(options)` | 核心 hook 重命名（`useReactTable` 在 legacy 适配器仍可用，但推荐 `useTable`） |
| `flexRender(component, props)` | `table.FlexRender({ header/cell/footer })` | 实例方法替代独立函数 |
| 全特性内置 | `tableFeatures({...})` 声明式注册 | tree-shakeable，按需付费 |
| `getCoreRowModel()` 等 options | `createXxxRowModel()` 注册到 features 的 rowModel slot | `getCoreRowModel`/`getSortedRowModel`/`getFilteredRowModel`/`getPaginationRowModel`/`getExpandedRowModel`/`getGroupedRowModel`/`getFacetedRowModel` 移到 `/legacy`，新 API 是 `createXxxRowModel` |
| `sortingFn`（column option） | `sortFn` | 重命名 |
| 内置 sortFns 对象 | `sortFn_alphanumeric`/`sortFn_text`/`sortFn_datetime` 等命名导出 | 按需 import，勿 `...sortFns` |
| `createColumnHelper<TData>()` | `createAppColumnHelper<TData>()`（via `createTableHook`）或 `createColumnHelper` 仍在 | 推荐 `createAppColumnHelper`，features 类型自动绑定 |
| `ColumnDef<TData>` | `ColumnDef<typeof features, TData>` | features 绑定到列类型 |
| 全局 `declare module '@tanstack/react-table'` 声明 meta | per-table `tableMeta`/`columnMeta`/`filterMeta` | 不再全局声明合并 |
| 内部状态管理 | TanStack Store atoms | 细粒度订阅、React Compiler 兼容 |
| `useReactTable` 全 state 订阅 | `useTable` 默认细粒度 + `table.Subscribe`/`table.atoms` | `useLegacyTable` 才是全 state |

## 2. 渐进迁移：`useLegacyTable`

`@tanstack/react-table/legacy` 提供 v8 风格 API，底层跑 v9。**deprecated**，仅作迁移过渡。

```bash
# 仍装主包，从 /legacy 子路径 import
pnpm add @tanstack/react-table
```

```tsx
import { useState } from 'react'
import { flexRender } from '@tanstack/react-table'
import {
  getCoreRowModel, getFilteredRowModel, getSortedRowModel, getPaginationRowModel,
  legacyCreateColumnHelper, useLegacyTable,
} from '@tanstack/react-table/legacy'
import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table'
import type { LegacyColumnDef, LegacyColumn, LegacyRow } from '@tanstack/react-table/legacy'

interface Person { name: string; email: string; age: number }

const columnHelper = legacyCreateColumnHelper<Person>()

const columns: LegacyColumnDef<Person>[] = [
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('email', { header: 'Email' }),
  columnHelper.accessor('age', { header: 'Age' }),
  columnHelper.display({ id: 'actions', header: 'Actions' }),
]

function MyTable({ data }: { data: Person[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const table = useLegacyTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  })

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(hg => (
          <tr key={hg.id}>
            {hg.headers.map(h => (
              <th key={h.id}>
                {flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getAllCells().map(cell => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### legacy 类型 helper

| 类型 | 说明 |
|------|------|
| `LegacyColumnDef<TData>` | 列定义（等价 v8 `ColumnDef<TData>`） |
| `LegacyColumn<TData>` | 列实例 |
| `LegacyRow<TData>` | 行实例 |
| `LegacyCell<TData>` | 单元格实例 |
| `LegacyTable<TData>` | 表实例 |
| `legacyCreateColumnHelper<TData>()` | 列工厂（StockFeatures 预绑定） |

### legacy 限制

- **bundle 大**：包含全部特性（无 tree-shaking），比 v8 还大（每个特性都增长了）
- **全 state 订阅**：创建 table 的组件每次 state 变都重渲染（无细粒度）
- **不能配 `createTableHook`**
- **`sortingFn` 仍可用**（legacy 内部转 `sortFn`），但自定义排序函数注意重命名
- **将移除**：仅作迁移过渡，规划时间线迁移到 `useTable`

### 迁移路径

1. `useLegacyTable` → `useTable`
2. 用 `tableFeatures({...})` 声明特性
3. `get*RowModel()` options → rowModel slot（`sortedRowModel: createSortedRowModel()` 等）
4. 类型 `Legacy*` → 标准 v9 类型
5. `flexRender` → `table.FlexRender`
6. `sortingFn` → `sortFn`

## 3. 与 TanStack Query 集成

服务端取数：Query 取数，Table 管状态。`manual*` 选项告诉 table 不要自己处理数据。

```tsx
import { useQuery } from '@tanstack/react-query'
import { tableFeatures, useTable, rowPaginationFeature, rowSortingFeature, columnFilteringFeature } from '@tanstack/react-table'
import type { PaginationState, SortingState, ColumnFiltersState } from '@tanstack/react-table'

const features = tableFeatures({
  rowPaginationFeature, rowSortingFeature, columnFilteringFeature,
  // 不注册 rowModel（服务端处理）
})

function UsersTable() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])

  const { data, isPending } = useQuery({
    queryKey: ['users', pagination, sorting, filters],
    queryFn: () => fetchUsers({ pagination, sorting, filters }),
    placeholderData: keepPreviousData,   // 翻页时保留旧数据（减少闪烁）
  })

  const table = useTable({
    features,
    columns,
    data: data?.rows ?? [],
    pageCount: data?.pageCount ?? -1,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    state: { pagination, sorting, columnFilters: filters },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setFilters,
  })

  if (isPending) return <Spinner />
  return <table>...</table>
}
```

> Query SSR 与缓存见 [../../tanstack/references/query.md](../../tanstack/references/query.md)。`keepPreviousData`（v4）在 v5 是 `placeholderData: keepPreviousData`。

## 4. 与 TanStack Router 集成

把 table state 同步到 URL search params（router 的 `validateSearch`）：

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const usersSearch = z.object({
  page: z.number().int().min(1).default(1),
  sort: z.string().default('-createdAt'),
})

export const Route = createFileRoute('/users')({
  validateSearch: usersSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ['users', deps],
      queryFn: () => fetchUsers(deps),
    })
  },
  component: UsersPage,
})

function UsersPage() {
  const { page, sort } = Route.useSearch()
  const navigate = useNavigate({ from: Route.id })

  const table = useTable({
    features, columns, data,
    state: {
      pagination: { pageIndex: page - 1, pageSize: 10 },  // URL 1-based → table 0-based
      sorting: parseSort(sort),
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex: page - 1, pageSize: 10 }) : updater
      navigate({ to: '.', search: { page: next.pageIndex + 1, sort } })
    },
    manualPagination: true,
  })

  return <table>...</table>
}
```

> 更简单的 URL 同步（不绑 Router）用 nuqs，见 [../../nuqs/references/parsers-community-tanstack-table.md](../../nuqs/references/parsers-community-tanstack-table.md)。Router 基础见 [../../tanstack/references/router.md](../../tanstack/references/router.md)。

## 5. 与 TanStack Form 集成

table 内行内编辑，或用 form 批量编辑选中行：

```tsx
import { useForm } from '@tanstack/react-form'

function EditRowForm({ row, onSubmit }: { row: LegacyRow<Person>; onSubmit: (v: Person) => void }) {
  const form = useForm({
    defaultValues: row.original,
    onSubmit: async ({ value }) => onSubmit(value),
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }}>
      <form.Field name="name" validators={{ onChange: z.string().min(1) }}>
        {(field) => <input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />}
      </form.Field>
      <form.Subscribe selector={(s) => s.canSubmit}>
        {(canSubmit) => <button type="submit" disabled={!canSubmit}>保存</button>}
      </form.Subscribe>
    </form>
  )
}
```

> Form 基础见 [../../tanstack/references/form.md](../../tanstack/references/form.md)。官方有 `with-tanstack-form` example。

## 6. 虚拟化（大表）

`@tanstack/react-virtual` 处理万行数据：

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function BigTable({ table }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  })

  return (
    <div ref={parentRef} style={{ height: 600, overflow: 'auto' }}>
      <table style={{ height: rowVirtualizer.getTotalSize() }}>
        <tbody>
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const row = table.getRowModel().rows[virtualRow.index]
            return (
              <tr
                key={row.id}
                style={{ position: 'absolute', top: 0, transform: `translateY(${virtualRow.start}px)`, height: virtualRow.size }}
              >
                {row.getAllCells().map(cell => <td key={cell.id}><table.FlexRender cell={cell} /></td>)}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

> 官方 examples：`virtualized-rows`/`virtualized-columns`/`virtualized-infinite-scrolling`/`web-worker-row-models`（极大数据用 Web Worker 算 row model）。

## 7. 设计系统库集成

官方 kitchen-sink examples 覆盖主流设计系统：
- `kitchen-sink-shadcn-base` / `kitchen-sink-shadcn-radix`（shadcn/ui）
- `kitchen-sink-mantine`（Mantine）
- `kitchen-sink-material-ui`（MUI）
- `kitchen-sink-chakra-ui`（Chakra v3）
- `kitchen-sink-react-aria`（React Aria）
- `kitchen-sink-hero-ui`（HeroUI）

还有 `lib-*` 系列封装好的库（如 `material-react-table`/`mantine-react-table`）——若不想自己写 markup，可直接用这些基于 Table v9 的成品库。

## 8. 速查

| 需求 | 做法 |
|------|------|
| 快速迁移（临时） | `useLegacyTable` + `/legacy` 导入（deprecated，大 bundle） |
| 完整迁移到 v9 | `useTable` + `tableFeatures` + `createXxxRowModel` + `table.FlexRender` |
| 服务端取数 | 只注册 feature（无 rowModel）+ `manualPagination`/`manualSorting`/`manualFiltering` + Query |
| URL 同步 | nuqs `useQueryStates`（简单）或 Router `validateSearch`（类型安全） |
| 行内编辑 | TanStack Form（`with-tanstack-form` example） |
| 大表 | `@tanstack/react-virtual`（`virtualized-rows` example） |
| 极大数据 | Web Worker row model（`web-worker-row-models` example） |
| 不想写 markup | `lib-shadcn-base`/`lib-mantine`/`lib-material-ui` 等成品库 |
