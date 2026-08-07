# TanStack Query

> 面向 `@tanstack/react-query@5.101+`（2026-07，v5 主线；v6 仅 Solid beta）。版本敏感，以下来自官方文档核对。服务端状态管理：缓存、后台刷新、stale-while-revalidate、乐观更新。与 [router.md](router.md) 的 loader 协调互补。

## 1. 安装与 QueryClient

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

```tsx
// app/providers.tsx (Next.js) 或 main.tsx (Vite)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,   // SSR 场景建议 > 0，避免 client 立即 refetch
        gcTime: 5 * 60 * 1000,  // 原 cacheTime，v5 改名
        retry: 3,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined
function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient()       // server: 每次新建
  if (!browserQueryClient) browserQueryClient = makeQueryClient()    // browser: 复用
  return browserQueryClient
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

> **SSR 关键**：browser 端必须复用 client（不能 `useState(() => new QueryClient())`）——否则 React 在初始渲染 suspend 时会丢掉 client。Next.js 流式 SSR 用 `@tanstack/react-query-next-experimental` 的 `ReactQueryStreamedHydration` 包裹。

## 2. `useQuery` — 单对象签名（v5）

v5 只支持对象签名（移除了 `useQuery(key, fn, options)` 重载）：

```tsx
import { useQuery } from '@tanstack/react-query'

function Todos() {
  const { isPending, isError, data, error, isFetching } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  if (isPending) return <span>Loading…</span>
  if (isError) return <span>Error: {error.message}</span>
  return <ul>{data.map(t => <li key={t.id}>{t.title}</li>)}</ul>
}
```

### 状态：`status` × `fetchStatus`（正交）

| `status` | 含义 | `fetchStatus` | 含义 |
|----------|------|---------------|------|
| `pending` | 还没有数据（v5 改名自 `loading`） | `fetching` | 正在请求 |
| `error` | 出错 | `paused` | 想请求但网络断（见 network mode） |
| `success` | 成功，有数据 | `idle` | 当前没在请求 |

布尔别名：`isPending`/`isError`/`isSuccess`/`isFetching`。

> v5 改名：`isLoading` → `isPending`；`isInitialLoading` → `isLoading`（现表示"首次加载"，= `isPending && isFetching`）。

### 重要默认

- `staleTime: 0` — 数据拿到就 stale（默认立即 refetch）。
- `gcTime: 5min` — 不活跃 observer 后，缓存保留 5 分钟再 GC（v5 改名自 `cacheTime`）。
- `refetchOnWindowFocus` / `refetchOnReconnect` / `refetchOnMount`: `true`（stale 时）。
- `retry: 3` — 失败重试 3 次（指数退避）。
- query 级 `onSuccess`/`onError`/`onSettled` **已移除**（v5）；只有 mutation 保留 callbacks。用 `QueryClient.setQueryDefaults` 或组件内 `useEffect` 替代。

## 3. Query Keys — 缓存的唯一标识

key 是序列化数组，**层级结构**表达依赖。前缀匹配用于批量操作：

```ts
['todos']                              // 所有 todos
['todos', { status: 'done' }]          // 已完成 todos
['todos', 5]                           // todo 5
['todos', 5, 'comments']              // todo 5 的评论
```

### Query Key Factory 模式

集中管理 key 与对应的 `queryFn`，避免散落字符串：

```ts
// query-keys.ts
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: TodoFilters) => [...todoKeys.lists(), filters] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
}

// 用法
useQuery({ queryKey: todoKeys.detail(5), queryFn: () => fetchTodo(5) })
queryClient.invalidateQueries({ queryKey: todoKeys.detail(5) })
queryClient.invalidateQueries({ queryKey: todoKeys.lists() })  // 批量失效所有 list
```

> v5：`hashQueryKey` 改名 `hashKey`。key 的对象按 key 排序后哈希，`{a:1,b:2}` 与 `{b:2,a:1}` 同 key。

## 4. `useMutation` — 修改与乐观更新

```tsx
const mutation = useMutation({
  mutationKey: ['addTodo'],
  mutationFn: (newTodo: NewTodo) => api.addTodo(newTodo),
  // callbacks 仅 mutation 保留（v5 query 级已移除）
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: todoKeys.lists() })
    const prev = queryClient.getQueriesData<Todo[]>({ queryKey: todoKeys.lists() })
    queryClient.setQueriesData<Todo[]>({ queryKey: todoKeys.lists() }, (old) => [...old, newTodo])
    return { prev }   // context 传给 onError 回滚
  },
  onError: (_err, _newTodo, ctx) => {
    queryClient.setQueriesData({ queryKey: todoKeys.lists() }, ctx?.prev)  // 回滚
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: todoKeys.lists() })  // 终态以服务端为准
  },
})

mutation.mutate({ title: 'Buy milk' })
mutation.mutateAsync({ title: 'Buy milk' }).then(/* ... */)
```

mutation 状态：`isPending`/`isSuccess`/`isError`/`isIdle`（还没调用过）、`data`/`error`/`variables`。

## 5. `QueryClient` 缓存操作

| 方法 | 作用 |
|------|------|
| `invalidateQueries({ queryKey, refetchType })` | 标记 stale 并 refetch（active 的 `active`，不活跃的 `inactive`，默认 `active`） |
| `prefetchQuery({ queryKey, queryFn })` | 预取并缓存（用户 hover/路由 preload） |
| `ensureQueryData({ queryKey, queryFn })` | 有缓存则返回，否则取数（router loader 常用） |
| `fetchQuery({ queryKey, queryFn })` | 强制取数（返回 Promise） |
| `getQueryData(queryKey)` | 同步读缓存（不取数） |
| `setQueryData(queryKey, updater)` | 直接写缓存（乐观更新） |
| `setQueriesData({ queryKey }, updater)` | 批量按前缀写 |
| `removeQueries({ queryKey })` | 删除缓存 |
| `resetQueries({ queryKey })` | 重置为 initial，触发 refetch |
| `cancelQueries({ queryKey })` | 取消进行中的请求（乐观更新前必做） |

## 6. Suspense — `useSuspenseQuery`

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'

function Todos() {
  const { data } = useSuspenseQuery({ queryKey: todoKeys.detail(5), queryFn: () => fetchTodo(5) })
  // data 保证非空（loading/error 交给 Suspense 与 Error Boundary）
  return <Todo todo={data} />
}

// 父组件
<Suspense fallback={<Spinner />}>
  <ErrorBoundary fallback={<Err />}>
    <Todos />
  </ErrorBoundary>
</Suspense>
```

变体：`useSuspenseQuery` / `useSuspenseInfiniteQuery` / `useSuspenseQueries`（并行）。

### `throwOnError` 默认

Suspense 模式下，默认**仅当缓存无数据时**才抛到 Error Boundary：

```ts
throwOnError: (error, query) => typeof query.state.data === 'undefined'
```

要让所有错误都进 Error Boundary，需手动抛：

```tsx
const { data, error, isFetching } = useSuspenseQuery({ queryKey, queryFn })
if (error && !isFetching) throw error
```

### `useQuery().promise` + `React.use()`（实验）

需 `experimental_prefetchInRender: true`。把 query 当 promise，用 `React.use` 在子组件 unwrap，父组件控制 Suspense 边界：

```tsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { experimental_prefetchInRender: true } },
})

function TodoList({ query }: { query: UseQueryResult<Todo[]> }) {
  const data = React.use(query.promise)   // 子组件 unwrap
  return <ul>{data.map(t => <li key={t.id}>{t.title}</li>)}</ul>
}

function App() {
  const query = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <TodoList query={query} />
    </Suspense>
  )
}
```

### 错误边界重置

`QueryErrorResetBoundary`（组件式）或 `useQueryErrorResetBoundary`（hook）让"重试"按钮重置 query 错误：

```tsx
<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary onReset={reset} fallbackRender={({ resetErrorBoundary }) => (
      <button onClick={() => resetErrorBoundary()}>重试</button>
    )}>
      <Page />
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

## 7. 与 TanStack Router 协调

Router loader 负责预取，组件用 `useSuspenseQuery` 读：

```tsx
// router.ts
export const Route = createFileRoute('/todos/$id')({
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: todoKeys.detail(params.id),
      queryFn: () => fetchTodo(params.id),
    })
  },
  component: TodoDetail,
})

// component.tsx
function TodoDetail() {
  const { id } = Route.useParams()
  const { data } = useSuspenseQuery({
    queryKey: todoKeys.detail(id),
    queryFn: () => fetchTodo(id),
  })
  return <Todo todo={data} />
}
```

`staleTime` 协调：router 侧 `staleTime: 0`（保证导航时 refetch），组件侧 `useSuspenseQuery` 用默认。详见 [router.md](router.md) 的 Query 集成节。

## 8. SSR 与 hydration

Next.js Pages Router 用 `dehydrate`/`HydrationBoundary`：

```tsx
// server
export async function getServerSideProps() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({ queryKey: ['todos'], queryFn: fetchTodos })
  return { props: { dehydratedState: dehydrate(queryClient) } }
}

// _app.tsx
<QueryClientProvider client={queryClient}>
  <HydrationBoundary state={pageProps.dehydratedState}>
    <Component {...pageProps} />
  </HydrationBoundary>
</QueryClientProvider>
```

Next.js App Router 流式：`@tanstack/react-query-next-experimental` 的 `ReactQueryStreamedHydration`，在 Client Component 里直接 `useSuspenseQuery`，结果从 server 流式到 client。

## 9. v5 Breaking Changes（迁移要点）

| v4 | v5 |
|----|-----|
| `useQuery(key, fn, options)` | `useQuery({ queryKey, queryFn, ...options })` 单对象 |
| `isLoading` | `isPending`；`isInitialLoading` → `isLoading` |
| `cacheTime` | `gcTime` |
| query 级 `onSuccess`/`onError`/`onSettled` | 已移除，仅 mutation 保留 |
| `hashQueryKey` | `hashKey` |
| `contextSharing` prop | 移除 |
| 最低 React 18 | — |
| `useInfiniteQuery` 的 `data.pages` | 仍是，但 `getPreviousPageParam`/`getNextPageParam` 写法统一 |

官方提供 codemod：`npx jscodeshift --transform=.../remove-overloads.cjs`。

## 10. 速查

| 需求 | 选择 |
|------|------|
| 读数据 | `useQuery({ queryKey, queryFn })` |
| 读数据 + Suspense | `useSuspenseQuery`（data 非空） |
| 并行多查询 | `useSuspenseQueries` |
| 写数据 | `useMutation` + `onMutate` 乐观 + `onSettled` 失效 |
| 失效缓存 | `invalidateQueries({ queryKey })`（前缀匹配） |
| 预取 | `prefetchQuery` / `ensureQueryData`（loader） |
| 乐观更新 | `onMutate` + `setQueryData`，`onError` 回滚 |
| 集中管理 key | query key factory |
| SSR | `dehydrate` + `HydrationBoundary` / `ReactQueryStreamedHydration` |
| 重试按钮 | `QueryErrorResetBoundary` |
| 与路由协调 | loader `ensureQueryData` + 组件 `useSuspenseQuery`（见 [router.md](router.md)） |
