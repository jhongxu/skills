# React Hook Form v7

> 面向 `react-hook-form@7.84`（v7 线稳定版；v8 beta 中）。非受控优先的表单库：用 ref 注册输入，状态更新隔离到单字段，几十个字段的大表单输入时不触发整树重渲染。配合 Zod 实现"定义一次 schema = 类型 + 校验 + 错误信息"。

为什么用 RHF：非受控设计（输入不触发组件重渲染，性能远超受控方案）、`register` 一行接入原生 input、`Controller` 桥接 antd/MUI 等受控组件库、`useFieldArray` 处理动态字段、与 Zod/Standard Schema 集成、Next.js Server Actions 友好。

> 替代选型 TanStack Form 见 [../tanstack/references/form.md](../tanstack/references/form.md)：API 更现代、原生 Standard Schema、类型更精确，但生态略新。RHF 生态成熟、文档全、antd 集成案例多。

## 1. 安装

```bash
pnpm add react-hook-form @hookform/resolvers zod
```

- `@hookform/resolvers` v5：Zod/Yup/Valibot 等 resolver 适配器
- `zod` v4：schema 校验，见 [zod](zod.md)

## 2. 最小表单

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.email('请输入合法邮箱'),
  password: z.string().min(8, '至少 8 位'),
  remember: z.boolean().optional(),
})
type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: false },
  })

  const onSubmit = handleSubmit(async (data) => {
    await api.login(data)
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <input type="email" {...register('email')} aria-invalid={!!errors.email} />
      {errors.email && <p role="alert">{errors.email.message}</p>}

      <input type="password" {...register('password')} />
      {errors.password && <p role="alert">{errors.password.message}</p>}

      <label>
        <input type="checkbox" {...register('remember')} /> 记住我
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '登录中…' : '登录'}
      </button>
    </form>
  )
}
```

## 3. `register`：注册原生 input

```tsx
<input {...register('name')} />

// 带校验规则（不用 schema 时）
<input
  {...register('age', {
    required: '必填',
    min: { value: 13, message: '13 岁以上' },
    valueAsNumber: true,   // 自动转 number
  })}
/>

// 受控值（如 select）
<select {...register('role')}>...</select>
```

> `register` 返回的 `name`/`onChange`/`onBlur`/`ref` 展开到原生 input 即可。用 schema 校验时不需要在 `register` 重复规则。

## 4. `Controller`：桥接受控组件库

antd / MUI / Radix 等组件不转发 ref 或是受控的，用 `Controller`：

```tsx
import { Controller } from 'react-hook-form'
import { Input, Switch } from 'antd'

<Controller
  control={control}
  name="username"
  rules={{ required: '必填' }}
  render={({ field, fieldState }) => (
    <Input
      {...field}
      status={fieldState.error ? 'error' : ''}
      placeholder="用户名"
    />
  )}
/>

<Controller
  control={control}
  name="enabled"
  render={({ field }) => (
    <Switch checked={field.value} onChange={field.onChange} />
  )}
/>
```

### `useController` + `FormProvider`：类型安全的可复用字段

```tsx
import { useForm, FormProvider, useFormContext, useController } from 'react-hook-form'

// 复用字段组件
function TextField({ name, label }: { name: string; label: string }) {
  const { control } = useFormContext()
  const { field, fieldState } = useController({ control, name })
  return (
    <label>
      {label}
      <input {...field} aria-invalid={!!fieldState.error} />
      {fieldState.error && <span>{fieldState.error.message}</span>}
    </label>
  )
}

// 父组件
function ProfileForm() {
  const form = useForm<ProfileValues>({ resolver: zodResolver(schema) })
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <TextField name="name" label="姓名" />
        <TextField name="email" label="邮箱" />
      </form>
    </FormProvider>
  )
}
```

## 5. `formState` 是 Proxy——最大的坑

`formState` 是 Proxy，只有**被解构订阅的字段**才会触发重渲染。在条件渲染前解构，否则该字段不更新：

```tsx
// ❌ isValid 永远不更新（条件渲染前没解构）
const { errors } = formState
return <button disabled={formState.isValid}>...</button>   // 读取未订阅的

// ✅ 先解构再读
const { errors, isValid, isSubmitting } = formState
return <button disabled={!isValid}>...</button>
```

> 订阅的 `formState` 字段：`errors`、`isDirty`、`isValid`、`isSubmitting`、`isSubmitSuccessful`、`touchedFields`、`dirtyFields`、`submitCount`。

## 6. 设计重渲染：`watch` / `useWatch` / `getValues`

| API | 重渲染范围 | 场景 |
|-----|-----------|------|
| `watch('field')` | 调用 `watch` 的整个组件 | 简单条件渲染 |
| `useWatch({ name })` | 只 `useWatch` 的子组件 | 隔离订阅，推荐 |
| `getValues('field')` | 不订阅（不触发重渲染） | 提交时/事件里读值 |
| `useFormState({ name })` | 只该字段的 formState | 隔离 formState 订阅 |

```tsx
// ✅ 隔离订阅到子组件
function ConditionalField() {
  const value = useWatch({ name: 'role' })   // 只 role 变化才重渲染
  if (value === 'admin') return <AdminFields />
  return null
}
```

> 大表单里 `watch` 会让整个组件每次输入都重渲染。用 `useWatch` 把条件渲染拆到子组件。

## 7. `useFieldArray`：动态字段

```tsx
const { fields, append, remove } = useFieldArray({ control, name: 'contacts' })

return (
  <div>
    {fields.map((field, index) => (
      <div key={field.id}>   {/* 用 field.id 做 key，非 index */}
        <input {...register(`contacts.${index}.name`)} />
        <input {...register(`contacts.${index}.email`)} />
        <button type="button" onClick={() => remove(index)}>删除</button>
      </div>
    ))}
    <button type="button" onClick={() => append({ name: '', email: '' })}>添加</button>
  </div>
)
```

> `key={field.id}`（非 `index`）——RHF 内部管理 id 保证增删不乱序。schema 里 `contacts: z.array(...)`。

## 8. 校验时机 `mode`

```tsx
useForm({
  mode: 'onSubmit',      // 默认：提交时校验
  // mode: 'onBlur',     // 失焦校验
  // mode: 'onChange',   // 每次输入校验
  // mode: 'onTouched',  // 首次失焦后改 onChange
  reValidateMode: 'onChange',  // 提交后重新校验的时机
  criteriaMode: 'all',         // 收集所有规则失败（默认只第一个）
  shouldFocusError: true,      // 提交失败自动聚焦第一个错误字段
})
```

## 9. 异步 `defaultValues`（编辑表单）

```tsx
function EditForm({ id }: { id: string }) {
  const { reset, ...form } = useForm<ProfileValues>({ resolver: zodResolver(schema) })

  // 异步加载后 reset
  useEffect(() => {
    fetchProfile(id).then((data) => reset(data))
  }, [id, reset])

  return <form>...</form>
}

// 或用 values prop（v7.20+，自动 reset）
useForm({ values: loadedData })
```

## 10. 提交：错误处理与防重复

```tsx
const onSubmit = handleSubmit(async (data) => {
  try {
    await api.save(data)
    reset()   // 成功后清空
  } catch (err) {
    // 服务端字段错误回填
    if (err.fieldErrors) {
      Object.entries(err.fieldErrors).forEach(([field, message]) => {
        setError(field, { type: 'server', message })
      })
    } else {
      setError('root', { message: '网络错误' })   // 表单级错误
    }
  }
})
```

> `handleSubmit` 已内置防重复提交（提交期间 `isSubmitting` 为 true，按钮 disable）。

## 11. 输入类型 ≠ 输出类型（transform）

Zod schema 带 transform 时，input 和 output 类型不同。RHF 用第三个泛型指定 output 类型：

```tsx
const schema = z.object({
  count: z.string().transform((s) => Number(s)),   // string → number
})

// TFieldValues=输入, TTransformedValues=输出
const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
  resolver: zodResolver(schema),
})

const onSubmit = handleSubmit((data) => {
  // data.count 是 number（已 transform）
})
```

## 12. Next.js Server Actions 集成

```tsx
'use client'
import { useActionState } from 'react'
import { useForm } from 'react-hook-form'

export function PostForm() {
  const [state, action, isPending] = useActionState(createPostAction, null)
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        const formData = new FormData()
        Object.entries(values).forEach(([k, v]) => formData.append(k, String(v)))
        action(formData)   // 调 Server Action
      })}
    >
      {/* RHF 管校验，Server Action 管提交 */}
    </form>
  )
}
```

> 也可直接 `<form action={serverAction}>`，但 RHF 校验在 `onSubmit` 里跑，需先 `handleSubmit`。Server Action 细节见 [../nextjs/references/server-actions.md](../nextjs/references/server-actions.md)。

## 13. 与本仓库其他 skill 的衔接

- schema 校验用 Zod，见 [zod](zod.md)。
- 受控组件库（antd）用 `Controller` 桥接，见 [../ui/references/antd-v6.md](../ui/references/antd-v6.md)。
- Server Actions 提交见 [../nextjs/references/server-actions.md](../nextjs/references/server-actions.md)。
- 替代选型 TanStack Form 见 [../tanstack/references/form.md](../tanstack/references/form.md)（原生 Standard Schema、API 更现代）。
- 测试表单见 [../foundation/references/vitest.md](../foundation/references/vitest.md)（`react-hook-form` 的 `handleSubmit` 用 `waitFor` 测异步）。
- API mock 见 [msw](msw.md)。

## 14. 坑

| 坑 | 说明 |
|----|------|
| `formState.isValid` 不更新 | Proxy：必须在条件渲染前解构 `const { isValid } = formState` |
| `watch` 导致大表单卡顿 | `watch` 订阅整个组件；改用 `useWatch` 拆子组件 |
| `useFieldArray` 用 `index` 做 key | 增删乱序；用 `field.id` |
| antd 组件 `ref` 不转发 | 用 `Controller` 包裹，不能直接 `register` |
| `defaultValues` 异步加载表单空 | `useEffect` 里 `reset(data)`，或用 `values` prop |
| 输入是 string 但要 number | `register('age', { valueAsNumber: true })` 或 schema transform |
| transform 后类型不对 | `useForm<Input, unknown, Output>` 三个泛型 |
| `setError` 服务端错误不显示 | 确认字段名与 `register` 的 name 一致；`type: 'server'` |
| 提交后表单没清空 | 成功后调 `reset()`（或 `reset(defaultValues)`） |
| Zod 4 `zodResolver` 报错 | 升 `@hookform/resolvers` 到支持 Zod 4 的版本 |
| RHF 校验 + Server Action 双重校验 | 客户端 RHF 快速反馈，服务端 Action 再校验（不可信客户端） |
