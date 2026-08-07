# 特性速查

> 面向 `@tanstack/react-table@9`。各特性的注册方式与核心 API。**所有特性遵循同一模式**：在 `tableFeatures` 注册 feature + rowModel → 用 `table.*/column.*/row.*` API。基础见 [core.md](core.md)。

## 0. 通用注册模式

```ts
const features = tableFeatures({
  rowXxxFeature,              // 1. 启用 API + state
  xxxRowModel: createXxxRowModel(),  // 2. 客户端算法（服务端取数则省略）
  // 3. 注册表（按需）
  sortFns: { ... },
  filterFns: { ... },
})
```

服务端取数（manual）场景：只注册 feature（拿 state + 回调），不注册 rowModel（让后端处理数据）。

## 1. Sorting（排序）

```ts
import {
  rowSortingFeature, createSortedRowModel,
  sortFn_alphanumeric, sortFn_text, sortFn_datetime,
} from '@tanstack/react-table'

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, datetime: sortFn_datetime },
})
```

| API | 作用 |
|-----|------|
| `column.getCanSort()` | 是否可排序 |
| `column.getIsSorted()` | `'asc'`/`'desc'`/`false` |
| `column.getToggleSortingHandler()` | 点击 handler |
| `column.setSortingState(updater)` | 设排序 |
| `table.setSorting(updater)` | 设排序（表级） |
| `table.getSortedRowModel()` | 排序后 row model |

### 列定义

```ts
{
  accessorKey: 'age',
  sortFn: 'alphanumeric',    // v8 的 sortingFn 改名
  // 或自定义：sortFn: (rowA, rowB, columnId) => ...
  enableSorting: true,       // 默认 true
  enableSortingRemoval: false, // 禁止取消排序（asc↔desc，不能回 false）
  sortDescFirst: true,       // 默认降序
}
```

### 多列排序

`SortingState` 是数组，可多列。`table.getState().sorting` 形如 `[{ id: 'age', desc: true }, { id: 'name', desc: false }]`。`column.getToggleSortingHandler()` 配合 `enableMultiSort`（默认 true）与 shift 键。

## 2. Column Filtering（列筛选）

```ts
import {
  columnFilteringFeature, createFilteredRowModel,
  filterFn_containsString, filterFn_includesString,
} from '@tanstack/react-table'

const features = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    containsString: filterFn_containsString,
    includesString: filterFn_includesString,
    // 自定义
    myFilter: (row, columnId, filterValue) => row.getValue(columnId) > filterValue,
  },
})
```

| API | 作用 |
|-----|------|
| `column.getCanFilter()` | 是否可筛选 |
| `column.getFilterValue()` | 当前筛选值 |
| `column.setFilterValue(value)` | 设筛选值 |
| `table.getColumnFilters()` | 列筛选状态数组 |
| `table.getFilteredRowModel()` | 筛选后 row model |

### 列定义

```ts
{
  accessorKey: 'name',
  filterFn: 'containsString',   // 注册表里的名
  // 或内联：filterFn: (row, columnId, filterValue) => ...
  // 或 'auto'：按列数据类型自动选
  enableColumnFilter: true,
}
```

## 3. Global Filtering（全局筛选）

```ts
import { rowFilteringFeature, createFilteredRowModel, filterFn_includesString } from '@tanstack/react-table'

const features = tableFeatures({
  rowFilteringFeature,                  // 全局筛选特性
  filteredRowModel: createFilteredRowModel(),  // 复用同一个 rowModel slot
  filterFns: { includesString: filterFn_includesString },
})
```

| API | 作用 |
|-----|------|
| `table.getGlobalFilter()` | 当前全局筛选值 |
| `table.setGlobalFilter(value)` | 设全局筛选 |
| `table.getGlobalFilterFn()` | 全局筛选函数 |

### 选项

```ts
useTable({
  features,
  columns,
  data,
  globalFilterFn: 'includesString',  // 默认全局筛选函数
  enableGlobalFilter: true,
})
```

## 4. Pagination（分页）

```ts
import { rowPaginationFeature, createPaginatedRowModel } from '@tanstack/react-table'

const features = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
})
```

| API | 作用 |
|-----|------|
| `table.getPageCount()` | 总页数 |
| `table.getRowCount()` | 总行数 |
| `table.getPaginationRowModel()` | 分页后 row model |
| `table.getState().pagination` | `{ pageIndex, pageSize }`（pageIndex **0 起**） |
| `table.setPageIndex(n)` | 跳页 |
| `table.setPageSize(n)` | 每页条数 |
| `table.nextPage()` / `previousPage()` | 翻页 |
| `table.getCanNextPage()` / `getCanPreviousPage()` | 是否可翻 |
| `table.getFirstPage()` / `getLastPage()` | 首末页 |

### 服务端分页

```ts
useTable({
  features,
  columns,
  data,
  pageCount: controlledPageCount,   // 服务端返回的总页数
  manualPagination: true,           // 告诉 table 不要自己分页
  // 不注册 paginatedRowModel
})
```

> 与 nuqs 同步分页到 URL 见 [../../nuqs/references/parsers-community-tanstack-table.md](../../nuqs/references/parsers-community-tanstack-table.md)（注意那篇写的是 v8，v9 把 `useReactTable` 改 `useTable`、`state`/`onPaginationChange` 写法一致）。

## 5. Row Selection（行选择）

```ts
import { rowSelectionFeature } from '@tanstack/react-table'

const features = tableFeatures({
  rowSelectionFeature,
  // 无 rowModel（选择是纯 state，不改变行集）
})
```

| API | 作用 |
|-----|------|
| `row.getIsSelected()` | 是否选中 |
| `row.getCanSelect()` | 是否可选 |
| `row.toggleSelected()` | 切换 |
| `row.toggleSelected(value?)` | 强制选/不选 |
| `table.getSelectedRowModel()` | 选中行 model（flat/leaf/grouped） |
| `table.getIsAllRowsSelected()` | 是否全选（当前页或全部） |
| `table.getIsSomeRowsSelected()` | 部分选中 |
| `table.toggleAllRowsSelected()` | 全选/取消 |

### 选项

```ts
useTable({
  features,
  columns,
  data,
  enableRowSelection: row => row.original.active,  // 按行决定是否可选
  // 或 enableRowSelection: true
})
```

## 6. Column Visibility（列可见性）

```ts
import { columnVisibilityFeature } from '@tanstack/react-table'

const features = tableFeatures({
  columnVisibilityFeature,
  // 无 rowModel
})
```

| API | 作用 |
|-----|------|
| `column.getIsVisible()` | 是否可见 |
| `column.getCanHide()` | 是否可隐藏 |
| `column.toggleVisibility()` | 切换可见 |
| `column.toggleVisibility(value?)` | 强制 |
| `table.getAllLeafColumns()` | 所有叶子列 |
| `table.getVisibleLeafColumns()` | 可见叶子列 |

## 7. Column Pinning（列固定）

```ts
import { columnPinningFeature } from '@tanstack/react-table'

const features = tableFeatures({
  columnPinningFeature,
})
```

| API | 作用 |
|-----|------|
| `column.getIsPinned()` | `'left'`/`'right'`/`false` |
| `column.pin(position)` | 固定 |
| `column.unpin()` | 取消固定 |
| `table.getLeftHeaderGroups()` / `getRightHeaderGroups()` | 左/右固定表头 |
| `table.getLeftLeafColumns()` / `getRightLeafColumns()` | 左/右固定叶子列 |
| `table.getCenterLeafColumns()` | 中间列 |

### 渲染（左/中/右三段）

```tsx
<table>
  <thead>
    <tr>
      {table.getLeftHeaderGroups().map(...)}
      {table.getCenterHeaderGroups().map(...)}
      {table.getRightHeaderGroups().map(...)}
    </tr>
  </thead>
  <tbody>
    {table.getRowModel().rows.map(row => (
      <tr key={row.id}>
        {row.getLeftVisibleCells().map(...)}
        {row.getCenterVisibleCells().map(...)}
        {row.getRightVisibleCells().map(...)}
      </tr>
    ))}
  </tbody>
</table>
```

## 8. Column Sizing / Resizing（列宽与拖拽调宽）

```ts
import { columnSizingFeature } from '@tanstack/react-table'

const features = tableFeatures({
  columnSizingFeature,
})
```

| API | 作用 |
|-----|------|
| `column.getSize()` | 当前列宽 |
| `column.getCanResize()` | 是否可调 |
| `column.getResizeHandler()` | 拖拽 handler |
| `column.resetSize()` | 重置 |
| `table.getState().columnSizing` | `{ [columnId]: number }` |
| `table.getState().columnSizingInfo` | 拖拽中状态（`deltaOffset`/`startSize` 等） |

### 列定义

```ts
{ accessorKey: 'name', size: 150, minSize: 80, maxSize: 300, enableResizing: true }
```

### 渲染拖拽手柄

```tsx
<th key={h.id} style={{ width: h.getSize() }}>
  <table.FlexRender header={h} />
  {h.column.getCanResize() && (
    <span
      onMouseDown={h.column.getResizeHandler()}
      onTouchStart={h.column.getResizeHandler()}
      style={{ display: 'inline-block', width: 4, cursor: 'col-resize' }}
    />
  )}
</th>
```

> v9 性能：列拖拽做了重大优化，大表更流畅。

## 9. Expanding（行展开）

```ts
import { rowExpandingFeature, createExpandedRowModel } from '@tanstack/react-table'

const features = tableFeatures({
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
})
```

| API | 作用 |
|-----|------|
| `row.getIsExpanded()` | 是否展开 |
| `row.getCanExpand()` | 是否可展开 |
| `row.toggleExpanded()` | 切换 |
| `row.getToggleExpandedHandler()` | handler |
| `table.getExpandedRowModel()` | 展开后 row model（含子行） |
| `table.getState().expanded` | `true` 或 `{ [rowId]: true }` |

### 选项

```ts
useTable({
  features,
  columns,
  data,
  getSubRows: row => row.subRows,   // 子行取数（默认 row.subRows）
  getRowId: row => row.id,          // 自定义行 id（展开 state 用）
})
```

### 渲染

```tsx
{row.getCanExpand() && (
  <button onClick={row.getToggleExpandedHandler()}>
    {row.getIsExpanded() ? '👇' : '👉'}
  </button>
)}
```

## 10. Grouping（分组聚合）

```ts
import {
  rowGroupingFeature, createGroupedRowModel,
  createAggregatedRowModel,
} from '@tanstack/react-table'

const features = tableFeatures({
  rowGroupingFeature,
  groupedRowModel: createGroupedRowModel(),
  // 聚合 row model（v9 新增 slot，按需）
})
```

| API | 作用 |
|-----|------|
| `column.getCanGroup()` | 是否可分组 |
| `column.getToggleGroupingHandler()` | handler |
| `column.getIsGrouped()` | 是否当前分组列 |
| `row.getIsGrouped()` | 是否是分组行 |
| `table.getState().grouping` | `string[]`（分组列 id） |

### 聚合函数

```ts
{
  accessorKey: 'visits',
  aggregationFn: 'sum',   // 内置：sum/min/max/avg/count/median/unique/inclusiveString
  // 或自定义：aggregationFn: (leafValues, columnId) => leafValues.reduce((a, b) => a + b, 0)
  aggregatedCell: ({ getValue }) => <b>{getValue()}</b>,
}
```

## 11. 其它特性速览

| 特性 | feature | rowModel | 关键 API |
|------|---------|----------|----------|
| Row Pinning | `rowPinningFeature` | — | `row.pin(position)`/`getIsPinned()`/`table.getTopRows()`/`getBottomRows()` |
| Cell Selection | `cellSelectionFeature` | — | `table.getCellSelectionState()`/`row.getIsCellSelected(cellId)` |
| Cell Spanning | `cellSpanningFeature` | — | `cell.getCanSpan()`/`rowSpan`/`colSpan` |
| Column Ordering | `columnOrderingFeature` | — | `column.getCanOrder()`/`table.setColumnOrder()`/`getState().columnOrder` |
| Column Faceting | `columnFacetingFeature` | `facetedRowModel` | `column.getFacetedUniqueValues()`/`getFacetedMinMaxValues()`/`getFacetedRowModel()` |

> 各特性详细 API 见官方对应 guide。模式一致：注册 feature（+rowModel）→ 用 API。

## 12. 速查

| 需求 | feature + rowModel |
|------|-------------------|
| 排序 | `rowSortingFeature` + `sortedRowModel: createSortedRowModel()` |
| 列筛选 | `columnFilteringFeature` + `filteredRowModel: createFilteredRowModel()` |
| 全局筛选 | `rowFilteringFeature` + 复用 `filteredRowModel` |
| 分页 | `rowPaginationFeature` + `paginatedRowModel: createPaginatedRowModel()` |
| 行选择 | `rowSelectionFeature`（无 rowModel） |
| 列可见性 | `columnVisibilityFeature`（无 rowModel） |
| 列固定 | `columnPinningFeature`（无 rowModel） |
| 列调宽 | `columnSizingFeature`（无 rowModel） |
| 行展开 | `rowExpandingFeature` + `expandedRowModel: createExpandedRowModel()` |
| 分组 | `rowGroupingFeature` + `groupedRowModel: createGroupedRowModel()` |
| 服务端取数 | 只注册 feature（拿 state+回调），不注册 rowModel，加 `manual*` 选项 |
