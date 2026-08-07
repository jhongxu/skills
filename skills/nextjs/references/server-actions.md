# Server Actions

> 面向 `next@16` + React 19。Server Actions 是跑在服务端的 async 函数，可在 Client Component 里直接调用——它是 Next.js 新的 API 层，取代手写 Route Handler 做变更。配合 `<form action>`、`useActionState`、`useFormStatus` 实现类型安全的表单提交与乐观更新。

为什么用 Server Actions：无需手写 API 端点、类型从服务端贯穿到客户端、自动 CSRF 防护（POST + Origin 校验）、与 RSC 集成可直接返回数据触发重渲染、构建时移除未引用的 action（v15+ 安全强化）。

## 1. 定义 Server Action

`'use server'` 指令有两种写法：

### 文件级（推荐）

整个文件所有导出都是 Server Action。适合放一组相关变更：

```ts
// app/actions/post.ts
'use server'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
})

export async function createPost(formData: FormData) {
  const parsed = schema.parse({
    title: formData.get('title'),
    content: formData.get('content'),
  })
  const post = await db.post.create({ data: parsed })
  revalidateTag('posts')
  redirect(`/blog/${post.id}`)
}

export async function deletePost(id: string) {
  await db.post.delete({ where: { id } })
  revalidateTag('posts')
}
```

### 函数级（内联）

单个函数加 `'use server'`，必须写在 Server Component 内：

```tsx
// app/page.tsx（Server Component）
export default function Page() {
  async function publish(formData: FormData) {
    'use server'
    await db.post.update({ where: { id: formData.get('id') as string }, data: { published: true } })
    revalidateTag('posts')
  }

  return <form action={publish}><input type="hidden" name="id" value="123" /><button>发布</button></form>
}
```

> 文件级更清晰、可复用、易测试。内联用于简单一次性场景。

## 2. 表单与 `useActionState`（React 19）

`<form action>` 直接接收 Server Action。要拿返回值/错误状态，用 `useActionState`：

```tsx
// app/ui/post-form.tsx
'use client'

import { useActionState } from 'react'
import { createPost } from '@/app/actions/post'

export function PostForm() {
  // state 初始值、action 是 Server Action
  const [state, formAction, isPending] = useActionState(createPostAction, null)

  return (
    <form action={formAction}>
      <input name="title" defaultValue={state?.values?.title} />
      {state?.errors?.title && <p className="error">{state.errors.title}</p>}

      <textarea name="content" defaultValue={state?.values?.content} />
      {state?.errors?.content && <p className="error">{state.errors.content}</p>}

      <SubmitButton />
    </form>
  )
}
```

Server Action 配合返回结构化结果（而非 `redirect`）时，包一层：

```ts
// app/actions/post.ts
'use server'

export async function createPostAction(_prev: unknown, formData: FormData) {
  const parsed = schema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })
  if (!parsed.success) {
    return {
      errors: zodErrors(parsed.error),
      values: { title: formData.get('title'), content: formData.get('content') },
    }
  }
  await db.post.create({ data: parsed.data })
  revalidateTag('posts')
  return { errors: null, values: null }
}
```

> `useFormState` 已废弃，改名 `useActionState`（React 19）。签名：`[state, action, isPending] = useActionState(fn, initialState)`。

## 3. `useFormStatus`（提交按钮）

```tsx
// app/ui/submit-button.tsx
'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>{pending ? '提交中…' : '提交'}</button>
}
```

`useFormStatus` 必须在 `<form>` **内部**的子组件里调用（读的是父级 `<form>` 的状态）。

## 4. 乐观更新 `useOptimistic`（React 19）

提交时先显示预期结果，失败回滚：

```tsx
'use client'

import { useOptimistic, useActionState } from 'react'
import { likePost } from '@/app/actions/post'

export function LikeButton({ post }: { post: { id: string; likes: number } }) {
  const [optimisticLikes, addOptimistic] = useOptimistic(
    post.likes,
    (state, _: void) => state + 1,
  )

  const [_, formAction] = useActionState(async () => {
    addOptimistic()
    await likePost(post.id)
  }, null)

  return (
    <form action={formAction}>
      <button>❤️ {optimisticLikes}</button>
    </form>
  )
}
```

## 5. 非 `<form>` 调用（按钮触发）

Server Action 也能在事件处理器里直接 `await` 调用（不限于表单）：

```tsx
'use client'

import { deletePost } from '@/app/actions/post'

export function DeleteButton({ id }: { id: string }) {
  return (
    <button onClick={async () => {
      if (confirm('确定删除？')) {
        await deletePost(id)   // 直接 await Server Action
      }
    }}>
      删除
    </button>
  )
}
```

> 这种调用方式不走 `<form>` 的渐进增强（JS 禁用时不工作）。能用 `<form>` 就用 `<form>`。

## 6. 参数绑定 `.bind`

固定部分参数，生成新的可调用函数（常用于传非表单数据）：

```tsx
// app/ui/admin.tsx
'use client'

import { updatePost } from '@/app/actions/post'

export function EditButton({ id }: { id: string }) {
  const updateBound = updatePost.bind(null, id)
  return (
    <form action={updateBound}>
      <input name="title" />
      <button>保存</button>
    </form>
  )
}
```

```ts
// app/actions/post.ts
'use server'

export async function updatePost(id: string, formData: FormData) {
  // id 是 bind 进来的，formData 来自表单
  await db.post.update({ where: { id }, data: { title: formData.get('title') } })
  revalidateTag('posts')
}
```

## 7. 校验（Zod / Standard Schema）

Server Action 的入参不可信（客户端可绕过），**必须服务端校验**。用 Zod：

```ts
'use server'

import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function signup(_prev: unknown, formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  await createUser(parsed.data)
  return { errors: null }
}
```

> Zod 用法见 [../../data-and-forms/references/zod.md](../../data-and-forms/references/zod.md)。TanStack Form 也支持 Standard Schema（含 Zod）做客户端即时校验，见 [../../tanstack/references/form.md](../../tanstack/references/form.md)。

## 8. 重验证与跳转

```ts
import { revalidateTag, revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function action() {
  'use server'
  await mutate()
  revalidateTag('posts')          // 失效带标签的缓存
  revalidatePath('/blog', 'page') // 失效整条路径
  redirect('/blog')               // 跳转（必须在外层调用，不能在 try/catch 里）
}
```

`redirect` 抛特殊异常实现跳转，**不能包在 try/catch**（会被吞）。缓存机制见 [data-fetching](data-fetching.md)。

## 9. 鉴权与 Cookies

Server Action 跑在服务端，能直接读 `cookies()`（鉴权）：

```ts
'use server'

import { cookies } from 'next/headers'

export async function deleteAccount() {
  const session = (await cookies()).get('session')?.value
  if (!session) throw new Error('未登录')
  const user = await verifySession(session)
  await db.user.delete({ where: { id: user.id } })
  redirect('/login')
}
```

## 10. 安全

| 项 | 说明 |
|----|------|
| 入参不可信 | 客户端可绕过 `<form>`，必须服务端校验（Zod） |
| 鉴权 | 每个 Action 都要校验登录态/权限 |
| CSRF | 自动防护：POST + Origin 头校验（v15+） |
| 端点不可猜 | v15+ Action 端点是不可猜测的 ID |
| 未引用 Action 移除 | 构建时未在代码里被引用的 Action 会被 tree-shake 掉 |
| 不要把敏感数据当代码字面量 | Action 代码会进客户端 bundle 的引用（但函数体不会） |

> Server Action 的**函数体**只跑在服务端、不会进客户端 bundle。但被 import 的引用会让客户端知道这个 Action 的存在（拿到调用句柄）。

## 11. `next/form`（`<form>` 增强组件）

Next.js 15+ 提供 `next/form`，给原生 `<form>` 加客户端导航（提交后用 RSC 更新而非整页刷新）：

```tsx
import Form from 'next/form'

export function SearchForm() {
  return (
    <Form action="/search">
      <input name="q" />
      <button>搜索</button>
    </Form>
  )
}
```

GET 表单提交后 URL 更新且走客户端导航（不重载页面）。

## 12. 与本仓库其他 skill 的衔接

- 表单进阶（异步校验、数组字段、debounce）见 [../../tanstack/references/form.md](../../tanstack/references/form.md)；可让 TanStack Form 的 `onSubmit` 调 Server Action。
- 数据校验见 [../../data-and-forms/references/zod.md](../../data-and-forms/references/zod.md)。
- 缓存失效机制见 [data-fetching](data-fetching.md)（`revalidateTag`/`cacheTag`）。
- 路由与跳转见 [app-router](app-router.md)。
- URL 状态见 [../../nuqs/SKILL.md](../../nuqs/SKILL.md)（搜索/筛选与 Server Action 配合）。
- React 19 的 `useActionState`/`useOptimistic` 见 [../../react/references/miscellaneous-apis.md](../../react/references/miscellaneous-apis.md)。

## 13. 坑

| 坑 | 说明 |
|----|------|
| `redirect` 在 try/catch 里不跳转 | `redirect` 抛异常实现跳转，会被 catch 吞掉；放在 try 外 |
| `useFormState` 找不到 | React 19 改名 `useActionState` |
| `useFormStatus` 拿不到 pending | 必须在 `<form>` 内部的子组件调用，不能在定义 `<form>` 的同一组件 |
| Server Action 报"客户端引用" | 检查返回值/参数是否可序列化（不能返回函数、Class 实例等） |
| 入参没校验被绕过 | 客户端 `<form>` 可绕过；必须 Zod 服务端校验 |
| 调用没触发重渲染 | 缓存没失效；调 `revalidateTag`/`revalidatePath` |
| 乐观更新不回滚 | `useOptimistic` 在 Action 抛错时自动回滚，但要在 action 里 `throw` |
| `bind` 后类型丢失 | 给 bound 函数显式标注类型，或用 `useActionState` 包装 |
| 非 `<form>` 调用无渐进增强 | onClick 调用需 JS；关键操作优先 `<form action>` |
