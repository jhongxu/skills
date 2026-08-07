# 核心 API（v9 心智）

> 面向 `@tanstack/react-table@9`（核心 `@tanstack/octane-table@9.0+`，2026-08 稳定）。版本敏感，以下来自官方文档核对。与 [../tanstack/references/query.md](../../tanstack/references/query.md)、[router.md](../../tanstack/references/router.md) 同生态不同库。

## 1. v9 心智：headless + 声明式特性

TanStack Table 是 **headless** 库——只管表格逻辑（排序/筛选/分页/选择/展开/分组…），markup 与样式 100% 归你。v9 的核心变化：

- **声明式特性注册**：`tableFeatures({...})` 声明这张表用哪些特性。只为你用的特性付费（tree-shakeable），API 也只在特性注册时才存在于类型上（feature-gated APIs）。
- **特性 + rowModel 分离**：特性（如 `rowSortingFeature`）启用 API 与 state；rowModel（如 `createSortedRowModel()`）提供客户端算法。服务端排序就只注册特性、不注册 rowModel。
- **状态基于 TanStack Store atoms**：细粒度订阅，React Compiler 兼容。
- **`table.FlexRender`**：实例方法渲染 header/cell/footer（替代 v8 独立 `flexRender`）。

## 2. 安装

```bash
pnpm add @tanstack/react-table
# 可选：devtools
pnpm add -D @tanstack/react-table-devtools
```

> 核心是 `@tanstack/octane-table`（框架无关），`@tanstack/react-table` 是 React 适配。其它框架：`@tanstack/angular-table`/`@tanstack/solid-table`/`@tanstack/svelte-table`/`@tanstack/vue-table`/`@tanstack/lit-table`/`@tanstack/preact-table`/`@tanstack/alpine-table`。

## 3. 最小表

```tsx
import { tableFeatures, useTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

type Person = { firstName: string; lastName: string; age: number }

const data: Person[] = [
  { firstName: 'tanner', lastName: 'linsley', age: 24 },
  { firstName: 'tandy', lastName: 'miller', age: 40 },
  { firstName: 'joe', lastName: 'dirte', age: 45 },
]

// v9：声明特性（暂无任何可选特性，core row model 自动包含）
const features = tableFeatures({})

const columns: ColumnDef<typeof features, Person>[] = [
  { accessorKey: 'firstName', header: 'First Name', cell: info => info.getValue() },
  {
    accessorFn: row => row.lastName,
    id: 'lastName',
    header: () => <span>Last Name</span>,
    cell: info => <i>{info.getValue<string>()}</i>,
  },
  { accessorKey: 'age', header: () => 'Age' },
]

export function PersonTable() {
  const table = useTable({
    key: 'person-table',   // 可选，devtools 用；不用 devtools 可省
    features,
    columns,
    data,
  })

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(hg => (
          <tr key={hg.id}>
            {hg.headers.map(h => (
              <th key={h.id}>
                {h.isPlaceholder ? null : <table.FlexRender header={h} />}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getAllCells().map(cell => (
              <td key={cell.id}><table.FlexRender cell={cell} /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

## 4. `tableFeatures` — 特性注册中心

传入一个对象，键是特性 slot，值是特性对象或 rowModel 工厂结果：

```ts
import {
  tableFeatures,
  rowSortingFeature,
  rowPaginationFeature,
  columnFilteringFeature,
  createSortedRowModel,
  createPaginatedRowModel,
  createFilteredRowModel,
  sortFns,
  filterFns,
} from '@tanstack/react-table'

const features = tableFeatures({
  // 特性：启用 API + state
  rowSortingFeature,
  rowPaginationFeature,
  columnFilteringFeature,
  // rowModel：客户端算法（服务端取数则省略对应 rowModel）
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  // 注册表（按需注册，不要 spread 全部）
  sortFns: { /* alphanumeric: sortFn_alphanumeric, ... */ },
  filterFns: { /* ... */ },
})
```

> **core row model 始终自动包含**，无需注册。Feature row model 是 slot（`sortedRowModel`/`paginatedRowModel`/`filteredRowModel`/`groupedRowModel`/`expandedRowModel`/`facetedRowModel`），类型检查会要求特性与对应 rowModel 同时存在。

### 注册表按需注册（性能）

```ts
import { sortFn_alphanumeric, sortFn_text, sortFn_datetime } from '@tanstack/react-table'

// ✅ 只注册用到的
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    datetime: sortFn_datetime,
  },
})

// ❌ 别这样（把全部内置函数打进 bundle）
// sortFns: { ...sortFns }
```

默认 `sortFn: 'auto'` 会按列数据类型解析为 `alphanumeric`/`text`/`datetime`，所以注册你列依赖的那几个即可。

## 5. `useTable` — 创建实例

```ts
const table = useTable({
  key: 'person-table',       // 可选，devtools 标识
  features,                  // 必填：特性集
  columns,                   // 必填：列定义
  data,                      // 必填：数据
  initialState: { ... },     // 可选：初始 state（不改后续）
  state: { ... },            // 可选：受控 state（见 state-and-composition.md）
  onSortingChange: ...,      // 可选：受控 state 回调
  // ...其它选项
})
```

> v9 类型：`ColumnDef<typeof features, TData>`——features 绑定到列定义，所以已注册特性的 API（如 `enableSorting`/`sortFn`）在列定义里才有类型。

## 6. `table.FlexRender` — 渲染 header/cell/footer

```tsx
<table.FlexRender header={header} />     // header
<table.FlexRender cell={cell} />         // cell
<table.FlexRender footer={footer} />     // footer（需列定义有 footer）
```

渲染列定义里的 `header`/`cell`/`footer`——可以是字符串、数字、React 节点、或函数（接收 context 返回节点）。v8 的独立 `flexRender(header, context)` 在 v9 仍可用（legacy），但推荐实例方法。

## 7. 渲染模式

### 基础渲染（getHeaderGroups / getRowModel）

```tsx
<thead>
  {table.getHeaderGroups().map(hg => /* ... */)}
</thead>
<tbody>
  {table.getRowModel().rows.map(row => (
    <tr key={row.id}>
      {row.getAllCells().map(cell => <td key={cell.id}><table.FlexRender cell={cell} /></td>)}
    </tr>
  ))}
</tbody>
```

### Footer

```tsx
<tfoot>
  {table.getFooterGroups().map(fg => (
    <tr key={fg.id}>
      {fg.headers.map(h => (
        <td key={h.id}>{h.isPlaceholder ? null : <table.FlexRender footer={h} />}</td>
      ))}
    </tr>
  ))}
</tfoot>
```

### 平铺渲染（getFlatHeaders / getCenterLeafHeaders 等）

复杂表头合并场景用 `table.getFlatHeaders()`/`getLeftHeaderGroups()`/`getCenterHeaderGroups()`/`getRightHeaderGroups()`（配合 column pinning）。

## 8. 加第一个特性：sorting

```tsx
import {
  createSortedRowModel, rowSortingFeature, sortFn_alphanumeric, sortFn_text,
  tableFeatures, useTable,
} from '@tanstack/react-table'

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

function PersonTable({ data, columns }) {
  const table = useTable({ key: 'person-table', features, columns, data })
  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(hg => (
          <tr key={hg.id}>
            {hg.headers.map(h => (
              <th key={h.id}>
                {h.isPlaceholder ? null : (
                  <div
                    style={{ cursor: h.column.getCanSort() ? 'pointer' : undefined }}
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    <table.FlexRender header={h} />
                    {{ asc: ' 🔼', desc: ' 🔽' }[h.column.getIsSorted() as string] ?? null}
                  </div>
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      {/* tbody 同上 */}
    </table>
  )
}
```

**所有特性遵循同一模式**：在 `tableFeatures` 注册特性 + rowModel → 用它添加到 table/column/row 的 API。详见 [features.md](features.md)。

## 9. `key` 与 devtools

```tsx
import { useTanStackTableDevtools } from '@tanstack/react-table-devtools'

function PersonTable() {
  const table = useTable({ key: 'person-table', features, columns, data })
  useTanStackTableDevtools(table)   // 注册到 devtools 面板
  // ...
}
```

`key` 是 devtools 识别表的标识。不用 devtools 可省略 `key`。

## 10. 速查

| 需求 | API |
|------|-----|
| 注册特性 | `tableFeatures({ rowSortingFeature, sortedRowModel: createSortedRowModel(), ... })` |
| 创建实例 | `useTable({ features, columns, data })` |
| 渲染 header/cell | `<table.FlexRender header={h} />` / `<table.FlexRender cell={c} />` |
| 表头行 | `table.getHeaderGroups()` |
| 数据行 | `table.getRowModel().rows` |
| 单元格 | `row.getAllCells()` |
| 加特性 | 注册 feature + 对应 rowModel → 用 `table.*/column.*/row.*` API |
| 按需注册 sortFns | `sortFns: { alphanumeric: sortFn_alphanumeric, ... }`（勿 `...sortFns`） |
| devtools 标识 | `useTable({ key: '...', ... })` + `useTanStackTableDevtools(table)` |
| 列定义类型 | `ColumnDef<typeof features, TData>` |
