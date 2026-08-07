# 列定义与渲染

> 面向 `@tanstack/react-table@9`。列定义的形状、columnHelper、cell/header/footer 渲染、meta 类型。基础见 [core.md](core.md)。

## 1. ColumnDef 形状

v9 的 `ColumnDef` 类型把 features 绑定进来：`ColumnDef<typeof features, TData>`。这样已注册特性的列选项（如 `sortFn`/`filterFn`/`aggregatedCell`）才有类型。

```ts
import type { ColumnDef } from '@tanstack/react-table'

const columns: ColumnDef<typeof features, Person>[] = [
  // 1. accessorKey 简写
  {
    accessorKey: 'firstName',
    header: 'First Name',
    cell: info => info.getValue(),
    footer: props => props.column.id,
  },
  // 2. accessorFn + id（无对应字段时）
  {
    accessorFn: row => `${row.firstName} ${row.lastName}`,
    id: 'fullName',
    header: () => <span>Full Name</span>,
    cell: info => <i>{info.getValue<string>()}</i>,
  },
  // 3. display column（无 accessor，纯展示/操作列）
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <button onClick={() => edit(row.original)}>Edit</button>,
  },
]
```

### 三种 ColumnDef

| 类型 | 用途 | 关键字段 |
|------|------|----------|
| `AccessorKeyColumnDef` | 字段直取（`accessorKey`） | `accessorKey: 'firstName'` |
| `AccessorFnColumnDef` | 函数派生（`accessorFn`） | `accessorFn: row => ...`, `id: '...'` |
| `DisplayColumnDef` | 纯展示/操作 | `id: '...'`（无 accessor） |
| `GroupColumnDef` | 表头分组 | `columns: [...]`（无 accessor） |

> `accessorKey` 与 `accessorFn` 二选一；用 `accessorFn` 时**必须**给 `id`。

## 2. cell / header / footer 的值类型

`cell`/`header`/`footer` 可接受：字符串、数字、React 节点、或函数（接收 context）。函数形式最灵活：

```ts
{
  accessorKey: 'age',
  header: () => 'Age',                       // 函数返回节点
  cell: info => info.getValue<number>(),      // cell 函数
  footer: info => info.column.id,
}
```

### Cell context（常用）

```ts
cell: ({ row, column, getValue, table, renderValue }) => {
  const value = getValue<number>()
  return <span style={{ color: value > 30 ? 'red' : undefined }}>{value}</span>
}
```

### Header context

```ts
header: ({ column, table, header }) => (
  <button onClick={column.getToggleSortingHandler()}>
    {column.columnDef.header} {/* 但这里会递归，用字符串字面量或 renderValue */}
  </button>
)
```

> header 函数里若要嵌入列定义的 header 文本，用 `renderValue` 或直接写字面量，避免递归引用 `columnDef.header`。

### 聚合 cell（grouping 时）

```ts
{
  accessorKey: 'visits',
  header: 'Visits',
  cell: info => info.getValue(),
  aggregatedCell: ({ getValue }) => <b>{getValue<number>()}</b>,  // 分组行显示
}
```

## 3. `createColumnHelper`（v9 推荐 createAppColumnHelper）

`createColumnHelper<TData>()` 创建带类型推断的列定义工厂。v9 中，配合 `createTableHook` 得到的 `createAppColumnHelper` 会自动绑定 features 类型（见 [state-and-composition.md](state-and-composition.md)）。

```ts
import { createColumnHelper } from '@tanstack/react-table'

const columnHelper = createColumnHelper<Person>()

const columns = [
  columnHelper.accessor('firstName', {     // accessor('key', options)
    header: 'First Name',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor(row => row.lastName, {  // accessor(fn, options) — id 必填
    id: 'lastName',
    header: 'Last Name',
  }),
  columnHelper.display({                    // display(options)
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <button>Edit {row.original.firstName}</button>,
  }),
  columnHelper.group({                      // group(options) — 表头分组
    id: 'name',
    header: 'Name',
    columns: [
      columnHelper.accessor('firstName', { header: 'First' }),
      columnHelper.accessor('lastName', { header: 'Last' }),
    ],
  }),
]
```

> v9 推荐 `createAppColumnHelper`（via `createTableHook`），它把 `typeof features` 绑定进去，列定义里直接能用特性选项而无需手动传 features 类型。见 [state-and-composition.md](state-and-composition.md)。

## 4. 表头分组

```ts
const columns = [
  {
    id: 'name',
    header: () => <strong>Name</strong>,
    columns: [
      { accessorKey: 'firstName', header: 'First' },
      { accessorKey: 'lastName', header: 'Last' },
    ],
  },
  {
    id: 'info',
    header: 'Info',
    columns: [
      { accessorKey: 'age', header: 'Age' },
      { accessorKey: 'visits', header: 'Visits' },
    ],
  },
]
```

`table.getHeaderGroups()` 返回多层 header groups，渲染时按 `hg.depth` 缩进/合并。

## 5. 列宽与 sizing

列宽相关见 [features.md](features.md) 的 Column Sizing 节。列定义层面：

```ts
{
  accessorKey: 'firstName',
  header: 'First Name',
  size: 150,          // 默认宽度
  minSize: 80,
  maxSize: 300,
}
```

## 6. Meta：per-table 类型（v9 新）

v9 不再要求全局声明合并 `ColumnMeta`/`TableMeta`/`FilterMeta`。改为 per-table 的 `tableMeta`/`columnMeta`/`filterMeta` slot：

```ts
import { tableFeatures, useTable, createColumnHelper } from '@tanstack/react-table'

// 1. 定义 meta 接口
interface MyColumnMeta {
  className?: string
  readOnly?: boolean
}
interface MyTableMeta {
  updateUser: (id: string) => void
}

// 2. 通过 createTableHook 或 tableFeatures 绑定 meta 类型
//    （createTableHook 路径见 state-and-composition.md）
//    或直接在 ColumnDef 上加 columnMeta
const columnHelper = createColumnHelper<Person>()

const columns = [
  columnHelper.accessor('firstName', {
    header: 'First Name',
    meta: { className: 'text-bold', readOnly: true } as MyColumnMeta,
  }),
]

// 3. 使用
const table = useTable({ features, columns, data })
table.options.meta  // MyTableMeta | undefined
column.columnDef.meta  // MyColumnMeta | undefined
```

> 优势：不同表可以有不同 meta 类型，互不污染，无需 `declare module '@tanstack/react-table'`。

## 7. 列定义的其它常用选项

| 选项 | 作用 |
|------|------|
| `id` | 列唯一标识（accessorKey 时默认为 key） |
| `enableSorting` | 该列是否可排序（默认 true，需注册 sorting feature） |
| `enableHiding` | 该列是否可隐藏（默认 true） |
| `enableColumnFilter` | 该列是否可筛选 |
| `enablePinning` | 该列是否可固定 |
| `enableResizing` | 该列是否可拖拽调宽 |
| `sortFn` | 排序函数名或自定义（v8 的 `sortingFn` 改名） |
| `filterFn` | 筛选函数名或自定义 |
| `sortingFn` | ❌ v9 移除，改 `sortFn` |
| `cell`/`header`/`footer` | 渲染 |
| `aggregatedCell` | 分组行该列的 cell |
| `meta` | 自定义元数据（per-table 类型） |

## 8. 速查

| 需求 | 做法 |
|------|------|
| 字段直取列 | `{ accessorKey: 'x', header, cell }` |
| 函数派生列 | `{ accessorFn: row => ..., id: 'x', ... }` |
| 纯展示/操作列 | `{ id: 'actions', cell: ({ row }) => ... }`（display） |
| 表头分组 | `{ id: 'g', header, columns: [...] }`（group） |
| 类型安全的列工厂 | `createColumnHelper<TData>()` 或 `createAppColumnHelper`（推荐） |
| cell 拿值 | `info.getValue()` / `info.getValue<number>()` |
| cell 拿原行 | `info.row.original` |
| 自定义排序 | `sortFn: 'alphanumeric'` 或 `sortFn: (a, b) => ...` |
| 列 meta | `meta: { ... }` + per-table 接口（无需全局声明合并） |
| 列宽 | `size`/`minSize`/`maxSize`（resizing 见 features.md） |
| 聚合 cell | `aggregatedCell: ({ getValue }) => ...` |
