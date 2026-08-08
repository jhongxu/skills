# Zustand v5

> 面向 `zustand@5`（最新 5.0.14）。React 最轻量的客户端状态管理库。无 Provider、无 boilerplate、基于原生 `useSyncExternalStore`。中后台默认的"客户端状态"方案——与 TanStack Query（服务端状态）分工：Zustand 管 UI 状态（主题、侧边栏、草稿），Query 管服务端数据缓存。

为什么用 Zustand v5：原生 `useSyncExternalStore`（React 19 concurrent 兼容）、严格 `Object.is` 相等性检查（避免意外重渲染）、无 Provider（任何组件直接订阅）、`useShallow` 浅比较、middleware 组合（persist/devtools/immer）、store 可在 React 外访问（`getState`/`setState`/`subscribe`）。

## 1. 安装

```bash
pnpm add zustand
```

要求 React 18+、TypeScript 4.5+。

## 2. 最小 store

```ts
import { create } from 'zustand'

interface CounterStore {
  count: number
  increment: () => void
  reset: () => void
}

const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}))
```

```tsx
function Counter() {
  const count = useCounterStore((s) => s.count)          // 选择器：只订阅 count
  const increment = useCounterStore((s) => s.increment)
  return <button onClick={increment}>{count}</button>
}
```

> 关键：用选择器 `useStore((s) => s.xxx)` 只订阅需要的字段。不写选择器 `useStore()` 会订阅整个 store——任意字段变化都重渲染。

## 3. 选择器与 `useShallow`（v5 核心变化）

v5 用严格 `Object.is` 做相等性检查，`create` 不再接受 equality 函数。订阅多个字段返回新对象时，必须用 `useShallow`：

```tsx
import { useShallow } from 'zustand/react/shallow'

function UserInfo() {
  // ✅ useShallow：浅比较，name/email 不变则不重渲染
  const { name, email } = useUserStore(
    useShallow((s) => ({ name: s.name, email: s.email })),
  )
  return <div>{name} - {email}</div>
}

// ❌ 不用 useShallow：每次返回新对象，Object.is 永远不等，每次都重渲染
const { name } = useUserStore((s) => ({ name: s.name }))
```

```tsx
// 多字段用数组也行
import { useShallow } from 'zustand/react/shallow'

function Profile() {
  const [name, age] = useUserStore(useShallow((s) => [s.name, s.age]))
}
```

> 从 v4 迁移：v4 用 `create` + `shallow`（`create<T>(fn, { equalityFn: shallow })`）。v5 改用 `createWithEqualityFn`（保留旧 equality）或迁移到 `useShallow`（推荐）。

## 4. 在 React 外访问

```ts
// 任何地方都能读写
useCounterStore.getState()           // { count: 5, increment, reset }
useCounterStore.setState({ count: 0 })
useCounterStore.subscribe((state) => console.log(state.count))

// 非组件代码（utils、Server Action、定时器）直接操作
function logOut() {
  useUserStore.getState().clearUser()
}
```

> 这是 Zustand 相对 Context 的核心优势：状态可在 React 树外读写，不需 hooks。

## 5. Slices 模式（组合多个 store）

大型应用拆成 slices 再合并：

```ts
// slices/userSlice.ts
import { StateCreator } from 'zustand'

export interface UserSlice {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

export const createUserSlice: StateCreator<UserSlice, [], [], UserSlice> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
})
```

```ts
// store.ts
import { create } from 'zustand'
import { createUserSlice, UserSlice } from './slices/userSlice'
import { createCartSlice, CartSlice } from './slices/cartSlice'

type Store = UserSlice & CartSlice

export const useStore = create<Store>()((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a),
}))
```

> Slices 之间可互相读：`createUserSlice` 的 `get` 能拿到整个 `Store`。

## 6. 中间件

### persist（持久化）

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'settings',                // localStorage key
      // partialize: (s) => ({ theme: s.theme }),  // 只持久化部分字段
      // storage: createJSONStorage(() => sessionStorage),  // 换存储
    },
  ),
)
```

> v5 变化：persist 不再在创建时存初始状态（v4 会），减少首屏闪烁。敏感数据（token）别持久化，用 `partialize` 排除。

### immer（不可变更新语法）

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface TodoStore {
  todos: Todo[]
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
}

export const useTodoStore = create<TodoStore>()(
  immer((set) => ({
    todos: [],
    addTodo: (text) => set((state) => {
      state.todos.push({ id: crypto.randomUUID(), text, done: false })   // 直接改
    }),
    toggleTodo: (id) => set((state) => {
      const todo = state.todos.find((t) => t.id === id)
      if (todo) todo.done = !todo.done
    }),
  })),
)
```

### devtools（Redux DevTools）

```ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useStore = create<Store>()(
  devtools(
    (set) => ({ /* ... */ }),
    { name: 'AppStore', enabled: process.env.NODE_ENV === 'development' },
  ),
)
```

### 中间件组合顺序

```ts
// 顺序：devtools 最外，immer 最内
create<Store>()(
  devtools(
    persist(
      immer((set) => ({ /* ... */ })),
      { name: 'store' },
    ),
  ),
)
```

> 错误顺序会破坏 DevTools 时间旅行和 persist 行为。规则：**devtools outermost，immer innermost**。

## 7. TypeScript：双括号

中间件需要双括号 `create<T>()(...)`：

```ts
// 无中间件：单括号
create<Store>((set) => ({ /* ... */ }))

// 有中间件：双括号（curry）
create<Store>()(
  persist((set) => ({ /* ... */ }), { name: 'store' }),
)
```

## 8. 异步 action

```ts
interface UserStore {
  user: User | null
  loading: boolean
  error: string | null
  fetchUser: (id: string) => Promise<void>
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  error: null,
  fetchUser: async (id) => {
    set({ loading: true, error: null })
    try {
      const user = await fetch(`/api/users/${id}`).then((r) => r.json())
      set({ user, loading: false })
    } catch {
      set({ error: '获取失败', loading: false })
    }
  },
}))
```

> 服务端数据用 TanStack Query 更合适（缓存、重试、失效），见 [../tanstack/references/query.md](../tanstack/references/query.md)。Zustand 管客户端 UI 状态。

## 9. 临时 store（组件内）

不共享的状态用临时 store，无需全局：

```tsx
import { useMemo } from 'react'
import { create } from 'zustand'

function EditableCell({ initialValue }: { initialValue: string }) {
  const useStore = useMemo(
    () => create<{ value: string; setValue: (v: string) => void }>((set) => ({
      value: initialValue,
      setValue: (value) => set({ value }),
    })),
    [initialValue],
  )
  const value = useStore((s) => s.value)
  const setValue = useStore((s) => s.setValue)
  return <input value={value} onChange={(e) => setValue(e.target.value)} />
}
```

## 10. 与本仓库其他 skill 的衔接

- 服务端状态（API 缓存、重试、失效）用 TanStack Query，见 [../tanstack/references/query.md](../tanstack/references/query.md)——别用 Zustand 存服务端数据。
- Zustand 的 Provider-less 特性适合放 [../nextjs/references/rsc-patterns.md](../nextjs/references/rsc-patterns.md) 的 client 边界外（如全局单例），但订阅必须在 Client Component。
- URL 状态（可分享的筛选/排序）用 nuqs，见 [../nuqs/SKILL.md](../nuqs/SKILL.md)。
- 表单状态推荐 TanStack Form / React Hook Form，见 [../tanstack/references/form.md](../tanstack/references/form.md) 或 [react-hook-form](react-hook-form.md)。
- 测试 store 见 [../foundation/references/vitest.md](../foundation/references/vitest.md)（mock store 用 `useStore.setState`）。

## 11. 坑

| 坑 | 说明 |
|----|------|
| 订多个字段无限重渲染 | v5 严格 `Object.is`；用 `useShallow` 包选择器 |
| `create(fn, { equalityFn })` 报错 | v5 移除该重载；改 `createWithEqualityFn` 或 `useShallow` |
| 整个 store 订阅（`useStore()`） | 任意字段变都重渲染；用选择器 |
| persist 持久化了敏感数据 | 用 `partialize` 排除 token/密钥；或换 `sessionStorage` |
| 中间件顺序错 | devtools 最外、immer 最内 |
| SSR 状态串到下个请求 | 别在模块作用域放用户特定状态；用临时 store 或 context 隔离 |
| 双括号漏写 | `create<T>()(middleware(...))` 有中间件时必须双括号 |
| persist 首屏闪烁 | v5 不再创建时存初始状态；用 `skipHydration` + 手动 `rehydrate()` 控制 |
| 在 Server Component 订阅 store | `useStore` 只在 Client Component；Server 里用 `getState()` 读（不订阅） |
| store 变量放组件内每次重建 | store 必须模块作用域；组件内用 `useMemo(create, deps)` |
