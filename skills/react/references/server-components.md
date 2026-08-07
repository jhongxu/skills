# Server Components

> 面向 React 19 RSC（19.0 起稳定）。框架细节（App Router 路由约定、缓存）见 [../nextjs/SKILL.md](../../nextjs/SKILL.md)；本篇讲 RSC 通用模型与指令语义。

## 三种运行环境

| 环境 | 文件/指令 | 能做 | 不能做 |
|------|-----------|------|--------|
| Server Component | 默认（无指令） | 直连 DB / 文件系统 / 私有 API；async 取数 | 用 hooks、事件、浏览器 API |
| Client Component | `'use client'` 顶部 | 用 hooks、state、事件、浏览器 API | 直连后端私钥/DB |
| Server Function | `'use server'` | 在服务端执行，可被 client 调用 | 返回不可序列化值、在渲染期调用 |

Server Component 是**默认**；只有需要交互的地方才加 `'use client'`。

## 指令

### `'use client'` — 标记 client 边界

```tsx
// app/counter.tsx
'use client'

import { useState } from 'react'

export function Counter() {
  const [n, setN] = useState(0)
  return <button onClick={() => setN(n + 1)}>{n}</button>
}
```

- 放在文件**最顶部**（注释之前）。
- 标记后，该文件及其 import 树进入 client bundle。
- Server Component 可以 import 并渲染 Client Component，反过来不行（Client 不能 import Server，但可以接收 Server Function 引用作为 prop）。

### `'use server'` — 标记 Server Function

两种写法：

**A. 独立 actions 文件**（推荐，可被多处 import）：

```ts
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function createNote(formData: FormData) {
  await db.note.create({ title: formData.get('title') as string })
  revalidatePath('/notes')
}
```

**B. 内嵌在 Server Component 内**：

```tsx
// app/page.tsx（Server Component，无指令）
import { db } from '@/lib/db'

export default function Page() {
  async function createNote() {
    'use server'            // 函数级指令
    await db.note.create()
  }
  return <Form action={createNote} />
}
```

> 命名澄清（官方 2024-09 起）：所有带 `'use server'` 的叫 **Server Function**；只有传给 `action` prop 或在 Action 里调用的才叫 **Server Action**。不是所有 Server Function 都是 Action。

## Server Component 能/不能

### 能：直接 async 取数

```tsx
// app/users/page.tsx
import { db } from '@/lib/db'

export default async function Page() {
  const users = await db.user.findMany()   // 服务端直连
  return (
    <ul>
      {users.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  )
}
```

无需 `useEffect`、无需 `useState`、无需 loading 状态管理（loading 走 Suspense，见 [concurrent-features.md](concurrent-features.md)）。

### 不能：用 hooks / 事件

```tsx
// ❌ Server Component 里
export default function Page() {
  const [n, setN] = useState(0)              // TypeError: useState is not a function
  return <button onClick={() => {}}>x</button> // onClick 在 Server Component 无意义
}
```

需要交互 → 把那块拆成 Client Component。

### 不能：在渲染期调用 Server Function

```tsx
// ❌ Server Function 是给 client 调用的，不是渲染时跑
export default async function Page() {
  await createNote() // Server Function 不能在 Server Component 渲染中调用
}
```

要在服务端跑逻辑？直接调普通 async 函数 / DB，不要加 `'use server'`。

## 数据流：Server → Client

Server Component 把数据或 Server Function 引用作为 prop 传给 Client Component：

```tsx
// app/page.tsx (Server)
import { db } from '@/lib/db'
import { NoteList } from './note-list'

export default async function Page() {
  const notes = await db.note.findMany()   // 可序列化的纯数据
  return <NoteList initialNotes={notes} />
}
```

```tsx
// app/note-list.tsx (Client)
'use client'
import { useState } from 'react'
import { deleteNote } from './actions'      // Server Function 引用

export function NoteList({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes)
  return (
    <ul>
      {notes.map(n => (
        <li key={n.id}>
          {n.title}
          <button onClick={async () => { await deleteNote(n.id); setNotes(notes.filter(x => x.id !== n.id)) }}>
            删除
          </button>
        </li>
      ))}
    </ul>
  )
}
```

**序列化约束**：跨边界只能传可序列化值（字符串、数字、布尔、数组、普通对象、Date、Map、Set、`FormData`、Server Function 引用）。不能传函数、类实例、`Symbol`（除 React 内部）、`Promise`（除非用 `use` 显式承接，见下）。

## Server Function 配合 Actions

### 表单：直接传给 `action`

```tsx
// app/actions.ts
'use server'
export async function createNote(formData: FormData) {
  await db.note.create({ title: formData.get('title') as string })
}
```

```tsx
// app/page.tsx (Server)
import { createNote } from './actions'

export default function Page() {
  return (
    <form action={createNote}>
      <input name="title" />
      <button type="submit">新建</button>
    </form>
  )
}
```

无需 JS 也能提交（渐进增强）。表单成功后 React 自动重置。

### `useActionState` 拿 pending + 返回值

```tsx
'use client'
import { useActionState } from 'react'
import { updateName } from './actions'

export default function UpdateName() {
  const [state, submitAction, isPending] = useActionState(updateName, { error: null })
  return (
    <form action={submitAction}>
      <input name="name" disabled={isPending} />
      {state.error && <p>{state.error}</p>}
    </form>
  )
}
```

配合 Server Function 时，React 还会在 hydration 完成前**重放**用户提前提交的表单——用户不用等 JS 加载就能交互。

### 渐进增强：`permalink` 第三参

```tsx
const [, submitAction] = useActionState(updateName, null, '/name/update')
```

JS 未加载时表单提交会导航到 `/name/update`，保证裸 HTML 也能工作。

## 边界划分原则

把 `'use client'` 推到**叶子**，让 client bundle 最小：

```tsx
// ✅ 整页是 Server，只有按钮是 Client
// app/page.tsx (Server)
export default async function Page() {
  const product = await db.product.findFirst()
  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>        {/* 静态内容，0 JS */}
      <AddToCart id={product.id} />        {/* 唯一的交互岛 */}
    </article>
  )
}
```

```tsx
// app/add-to-cart.tsx (Client)
'use client'
export function AddToCart({ id }: { id: string }) { /* ... */ }
```

反模式：在顶层 layout 加 `'use client'`，会让整棵子树变成 client。

## 共享代码注意

- **模块级状态在 server 是单例**：模块作用域的 `let cache = new Map()` 会被多个请求共享 → 串数据。跨请求缓存用 `React.cache()` 或框架方案（Next.js 见 [../nextjs/references/data-fetching.md](../../nextjs/references/data-fetching.md)）。
- **Server Function 必须鉴权**：它本质是公开的 HTTP 端点。`'use server'` 导出的函数任何 client 都能调用，不要假设调用者已登录。
- **环境变量**：`NEXT_PUBLIC_*` / `VITE_` 前缀才会进 client；私钥只在 server 可见。

## 速查

| 想做的事 | 在哪做 |
|----------|--------|
| 直接查数据库 | Server Component |
| 用 useState / 事件 | Client Component（`'use client'`） |
| 客户端触发服务端写操作 | Server Function（`'use server'`） + Action |
| 表单提交到服务端 | `<form action={serverFn}>` + 可选 `useActionState` |
| 渲染期跑服务端逻辑 | 普通 async 函数，**别**加 `'use server'` |
| 跨边界传值 | 纯数据（可序列化）或 Server Function 引用 |
