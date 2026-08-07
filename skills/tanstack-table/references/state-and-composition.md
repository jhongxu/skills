# 状态与组合

> 面向 `@tanstack/react-table@9`。状态管理（atoms/受控/细粒度订阅）与 `createTableHook` 组件化封装。基础见 [core.md](core.md)。

## 1. 状态心智

v9 的状态基于 [TanStack Store](https://tanstack.com/store) atoms，带来三个能力：

1. **自动管理**：不传任何 `state`/`on[State]Change`，table 内部管，用 `table.getState()` 读。
2. **受控切片**：把某个 state 切片提到自己的 `useState`/URL/Zustand，传 `state` + `on[State]Change`。
3. **细粒度订阅**：用 `table.Subscribe`/`table.atoms`/selector 只在某切片变化时重渲染。

> 与 React Compiler 兼容——state 系统是响应式 foundation，不会被编译器破坏。

## 2. 自动管理 + initialState

```ts
const table = useTable({
  features,
  columns,
  data,
  initialState: {
    pagination: { pageIndex: 0, pageSize: 20 },
    sorting: [{ id: 'createdAt', desc: true }],
    columnVisibility: { age: false },
  },
})

// 读
table.getState().pagination   // { pageIndex: 0, pageSize: 20 }
table.getState().sorting       // [{ id: 'createdAt', desc: true }]
```

> **不要**把同一 state 同时放 `initialState` 和 `state`——`state` 会覆盖 `initialState`。`initialState` 只设初值，不参与后续受控。

## 3. 受控切片（controlled）

只控制你需要的切片（推荐），其余仍由 table 内部管：

```tsx
const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

const table = useTable({
  features,
  columns,
  data,
  state: { sorting, pagination },          // 受控值
  onSortingChange: setSorting,             // 受控回调
  onPaginationChange: setPagination,
})

// 现在可以从外部读/改
function resetSort() { setSorting([]) }
```

### on[State]Change 的 updater 语义

回调的 updater 可能是**值或函数**（与 React setState 一致）：

```ts
onSortingChange: (updater) => {
  setSorting(old => {
    const next = typeof updater === 'function' ? updater(old) : updater
    // 可在这里加副作用（埋点、同步到 URL 等）
    return next
  })
}
```

> **关键规则**：`on[State]Change` 必须配对应 `state` 切片。只传回调不传值 → 该 state 被"冻结"在初值。

### 全部受控（onStateChange）

```ts
const [state, setState] = useState(table.getInitialState())  // 拿全部初值

const table = useTable({
  features, columns, data,
  state,
  onStateChange: setState,
})
```

> 谨慎：把频繁变化的切片（如 `columnSizingInfo`）提到上层会拖性能。优先用切片受控。

## 4. 细粒度订阅（v9 重点）

v8 的 `useReactTable` 订阅整个 state，任一切片变都重渲染。v9 可只订阅某切片：

### `table.Subscribe`

```tsx
function PaginationInfo() {
  return (
    <table.Subscribe selector={(s) => s.pagination}>
      {(pagination) => (
        <span>第 {pagination.pageIndex + 1} / {table.getPageCount()} 页</span>
      )}
    </table.Subscribe>
  )
}
```

`selector` 返回的切片变化时才重渲染。这与 [../../tanstack/references/form.md](../../tanstack/references/form.md) 的 `form.Subscribe` 一致。

### `table.atoms` / `table.store`

更底层：直接访问 store atoms，配合 `useStore`（TanStack Store）做自定义订阅：

```tsx
import { useStore } from '@tanstack/react-store'

function TotalRows() {
  const rowCount = useStore(table.store, (s) => s.rowCount)
  return <span>共 {rowCount} 行</span>
}
```

### `useTable` 的 selector

```ts
const table = useTable({
  features, columns, data,
  // selector 选项：只在这片变化时重渲染当前组件
  stateSelector: (s) => ({ pagination: s.pagination, sorting: s.sorting }),
})
```

> `useLegacyTable` 不支持细粒度订阅——它总是全 state 订阅（见 [migration-and-integration.md](migration-and-integration.md)）。

## 5. 外部 state / atoms（own state slices）

v9 可用 `atoms` option 把某切片完全交给你的 store：

```ts
import { atom } from '@tanstack/react-store'

const sortingAtom = atom<SortingState>([])

const table = useTable({
  features, columns, data,
  atoms: { sorting: sortingAtom },
})

// 外部读写 atom
sortingAtom.set([{ id: 'name', desc: true }])
```

> 适合与 Zustand/Jotai 等外部状态库深度集成。常见场景仍是 `state`+`on[State]Change`。

## 6. 与 nuqs 同步状态到 URL

把分页/筛选/排序存 URL，刷新不丢。完整方案见 [../../nuqs/references/parsers-community-tanstack-table.md](../../nuqs/references/parsers-community-tanstack-table.md)。要点：

```tsx
const [{ pageIndex, pageSize }, setPagination] = useQueryStates(
  { pageIndex: parseAsIndex.withDefault(0), pageSize: parseAsInteger.withDefault(10) },
  { urlKeys: { pageIndex: 'page', pageSize: 'perPage' } },
)

const table = useTable({
  features, columns, data,
  state: { pagination: { pageIndex, pageSize } },
  onPaginationChange: (updater) => {
    setPagination((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next
    })
  },
})
```

> 该 reference 写的是 v8（`useReactTable`），v9 改 `useTable`，`state`/`onPaginationChange` 写法一致。

## 7. `createTableHook` — 组件化封装

多张表共享 features/rowModels/默认选项/组件时，用 `createTableHook` 定义一次：

```tsx
// hooks/table.ts
import {
  createTableHook, tableFeatures,
  rowSortingFeature, rowPaginationFeature, columnFilteringFeature,
  createSortedRowModel, createPaginatedRowModel, createFilteredRowModel,
  sortFn_alphanumeric, sortFn_text,
} from '@tanstack/react-table'

const features = tableFeatures({
  rowSortingFeature, rowPaginationFeature, columnFilteringFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

export const {
  useAppTable,
  createAppColumnHelper,
  useTableContext,
  useCellContext,
  useHeaderContext,
} = createTableHook({
  features,
  // 默认选项（每张表都生效）
  debugTable: false,
  enableSortingRemoval: false,
  // 可选：注册可复用组件
  tableComponents: { PaginationControls },
  cellComponents: { TextCell, NumberCell },
  headerComponents: { SortIndicator, ColumnFilter },
})
```

### 返回值

| 返回 | 用途 |
|------|------|
| `useAppTable({ columns, data })` | 创建实例（features 已绑定，不用再传） |
| `createAppColumnHelper<TData>()` | 列工厂（features 类型已绑定） |
| `useTableContext()` | 在注册组件里拿 table 实例（类型已知） |
| `useCellContext()` | 在 cell 组件里拿 cell |
| `useHeaderContext()` | 在 header 组件里拿 header |

### 列工厂（features 已绑定）

```tsx
const columnHelper = createAppColumnHelper<Person>()

const columns = [
  columnHelper.accessor('firstName', {
    header: 'First Name',
    // sortFn/filterFn 等特性选项有类型（因为 features 已绑定）
    sortFn: 'alphanumeric',
  }),
]
```

## 8. AppTable / AppHeader / AppCell 组件

注册了 `tableComponents`/`cellComponents`/`headerComponents` 后，table 实例上多了 `AppTable`/`AppHeader`/`AppCell` 组件，通过 context 拿实例：

```tsx
function UsersTable({ data }: { data: Person[] }) {
  const table = useAppTable({ columns, data })

  return (
    <table.AppTable>
      <table>
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <table.AppHeader header={h} key={h.id}>
                  {(header) => (
                    <th>
                      <table.FlexRender header={h} />
                      <header.SortIndicator />
                    </th>
                  )}
                </table.AppHeader>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getAllCells().map(c => (
                <table.AppCell cell={c} key={c.id}>
                  {(cell) => <td><cell.TextCell /></td>}
                </table.AppCell>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <table.PaginationControls />
    </table.AppTable>
  )
}
```

### 注册组件内拿实例

```tsx
function PaginationControls() {
  const table = useTableContext()   // 类型已知（features 已绑定）
  return (
    <table.Subscribe selector={(s) => s.pagination}>
      {(p) => (
        <div>
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>上一页</button>
          <span>第 {p.pageIndex + 1} 页</span>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>下一页</button>
        </div>
      )}
    </table.Subscribe>
  )
}

function SortIndicator() {
  const header = useHeaderContext()
  const sorted = header.column.getIsSorted()
  return <span>{sorted === 'asc' ? ' 🔼' : sorted === 'desc' ? ' 🔽' : ''}</span>
}
```

## 9. 何时用 createTableHook

| 场景 | 选择 |
|------|------|
| 单张表 | 直接 `useTable` + `tableFeatures` |
| 多张表共享 features/选项 | `createTableHook` → `useAppTable` |
| 多张表共享 UI 组件 | `createTableHook` + 注册 components → `AppTable`/`AppHeader`/`AppCell` |
| 不想传 `typeof features` 给 ColumnDef | `createAppColumnHelper`（features 自动绑定） |

> 等价于 TanStack Form 的 `createFormHook`（见 [../../tanstack/references/form.md](../../tanstack/references/form.md)）。`useLegacyTable` **不能**与 `createTableHook` 配合。

## 10. 速查

| 需求 | API |
|------|-----|
| 自动管 state | 不传 `state`/`on[State]Change`，`table.getState()` 读 |
| 初值 | `initialState: { pagination: ..., sorting: ... }` |
| 受控切片 | `state: { sorting }` + `onSortingChange: setSorting` |
| 全部受控 | `state` + `onStateChange`（谨慎，性能） |
| 细粒度订阅 | `<table.Subscribe selector={(s) => s.pagination}>` |
| 底层 store | `table.store` + `useStore(table.store, selector)` |
| 外部 atoms | `atoms: { sorting: myAtom }` |
| URL 同步 | nuqs `useQueryStates` + `state`/`on[State]Change`（见 nuqs skill） |
| 多表共享配置 | `createTableHook({ features, ... })` → `useAppTable`/`createAppColumnHelper` |
| 复用 UI 组件 | `createTableHook` + `tableComponents`/`cellComponents`/`headerComponents` → `table.AppTable`/`AppHeader`/`AppCell` |
| 组件内拿实例 | `useTableContext()`/`useCellContext()`/`useHeaderContext()` |
