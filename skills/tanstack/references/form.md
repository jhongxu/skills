# TanStack Form

> 面向 `@tanstack/react-form@1`。版本敏感，以下来自官方文档核对。类型安全、框架无关的表单库：字段级/表单级校验、同步/异步、原生 Standard Schema、数组字段、组件化封装。

## 1. 安装与最小表单

```bash
pnpm add @tanstack/react-form
```

```tsx
import { useForm } from '@tanstack/react-form'

interface Person {
  firstName: string
  lastName: string
}

function App() {
  const form = useForm({
    defaultValues: { firstName: '', lastName: '' } as Person,
    onSubmit: async ({ value }) => {
      console.log('提交', value)
    },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); void form.handleSubmit() }}>
      <form.Field
        name="firstName"
        validators={{
          onChange: ({ value }) =>
            value.length < 3 ? '至少 3 个字符' : undefined,
        }}
      >
        {(field) => (
          <>
            <input
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {!field.state.meta.isValid && (
              <em>{field.state.meta.errors.join(', ')}</em>
            )}
          </>
        )}
      </form.Field>

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <button type="submit" disabled={!canSubmit}>
            {isSubmitting ? '提交中…' : '提交'}
          </button>
        )}
      </form.Subscribe>
    </form>
  )
}
```

`useForm` 返回 form 实例；`form.Field` 是 render-prop 组件，`name` 必须是 `defaultValues` 的键（深路径见数组字段）。

## 2. Field 状态与 API

```ts
field.state.value           // 当前值
field.state.meta.errors     // string[] / 对象[]（按 validator 返回类型）
field.state.meta.errorMap   // { onChange?, onBlur?, onSubmit?, ... } 按"何时"分组
field.state.meta.isValid    // errors.length === 0
field.state.meta.isTouched  // 用户改过或 blur 过
field.state.meta.isDirty    // 改过（即使改回默认仍为 true，持久 dirty 语义）
field.state.meta.isPristine // !isDirty
field.state.meta.isDefaultValue  // 当前值 === 默认值（可还原"非持久 dirty"语义）
field.state.meta.isBlurred
field.state.meta.isValidating   // 异步校验进行中

field.handleChange(nextValue)   // 设值
field.handleBlur()              // 标记 blurred
```

> **dirty 语义**：TanStack Form 用**持久 dirty**（改过就 dirty，即使改回默认）。要 RHF/Formik 的"非持久 dirty"（改回默认就 clean），用 `!isDefaultValue`。

## 3. 校验

### 时机：`validators` 的回调

`<form.Field validators={{...}}>` 或 `useForm({ validators: {...} })`：

| 回调 | 触发 |
|------|------|
| `onMount` | 表单挂载时 |
| `onChange` / `onChangeAsync` | 值变化（每次键击） |
| `onBlur` / `onBlurAsync` | 失焦 |
| `onSubmit` / `onSubmitAsync` | 提交时 |
| `onInput` / `onInputAsync` | 输入（与 onChange 区别见官方） |
| `onDynamic` / `onDynamicAsync` | 动态依赖 |
| `onServer` | 服务端校验（SSR/Server Action 回填错误） |

返回 `string | undefined`（或对象）。同步先跑，同步成功才跑异步；`asyncAlways: true` 让异步不等同步。

### 异步防抖

```tsx
<form.Field
  name="email"
  asyncDebounceMs={500}            // field 级：所有 async 都防抖 500ms
  validators={{
    onChangeAsyncDebounceMs: 1500, // 覆盖：onChangeAsync 用 1500ms
    onChangeAsync: async ({ value }) => {
      const taken = await api.checkEmail(value)
      return taken ? '邮箱已被占用' : undefined
    },
  }}
>
```

### Field 级 vs Form 级

```tsx
useForm({
  defaultValues: { age: 0 },
  validators: {
    onChange: ({ value }) =>
      value.age < 13 ? '必须年满 13 岁' : undefined,
    // 也可返回 { fields: { age: 'msg', 'details.email': 'msg' } } 给多个字段设错
    onSubmitAsync: async ({ value }) => {
      const errs = await api.validate(value)
      if (errs) return {
        form: '数据不合法',
        fields: { age: '必须年满 13 岁', 'socials[0].url': 'URL 不存在' },
      }
    },
  },
})
```

> Form 级返回的 `fields` 错误可被同字段的 field 级校验**覆盖**——field 级优先。

### Standard Schema（Zod/Valibot/ArkType/Effect）

直接把 schema 作为 validator，原生支持：

```tsx
import { z } from 'zod'

const userSchema = z.object({
  age: z.number().gte(13, '必须年满 13 岁'),
})

const form = useForm({
  defaultValues: { age: 0 },
  validators: { onChange: userSchema },   // 直接传 schema
})
```

Form 级用 schema 时，`errorMap.onChange` 类型为 `Record<string, StandardSchemaV1Issue[]>`（按字段名分组），渲染时遍历：

```tsx
<form.Subscribe selector={(s) => [s.errorMap]}>
  {([errorMap]) =>
    errorMap.onChange ? (
      <em>{Object.values(errorMap.onChange).flat().map(i => i.message).join(', ')}</em>
    ) : null
  }
</form.Subscribe>
```

> schema **不做 transform**——只校验，提交时拿原值。Zod 基础见 [../../data-and-forms/references/zod.md](../../data-and-forms/references/zod.md)。要 transform 在 `onSubmit` 里做。

### 阻止无效提交

`canSubmit`：直到用户交互前为 `true`（即使字段"技术上"无效）。配合 `isPristine` 实现"改过才能提交"：

```tsx
<form.Subscribe selector={(s) => [s.canSubmit, s.isPristine, s.isSubmitting]}>
  {([canSubmit, isPristine, isSubmitting]) => (
    <button type="submit" disabled={!canSubmit || isPristine}>
      {isSubmitting ? '…' : '提交'}
    </button>
  )}
</form.Subscribe>
```

## 4. 数组字段

```tsx
interface Person {
  hobbies: Array<{ label: string; years: number }>
}

const form = useForm({
  defaultValues: { hobbies: [{ label: '', years: 0 }] } as Person,
  onSubmit: async ({ value }) => console.log(value),
})

return (
  <form.Field name="hobbies">
    {(field) => (
      <div>
        {field.state.value.map((_, i) => (
          <div key={i}>
            <form.Field name={`hobbies[${i}].label`}>
              {(sub) => <input value={sub.state.value} onChange={(e) => sub.handleChange(e.target.value)} />}
            </form.Field>
            <form.Field name={`hobbies[${i}].years`}>
              {(sub) => (
                <input type="number" value={sub.state.value}
                  onChange={(e) => sub.handleChange(e.target.valueAsNumber)} />
              )}
            </form.Field>
            <button type="button" onClick={() => field.removeValue(i)}>删除</button>
          </div>
        ))}
        <button type="button" onClick={() => field.pushValue({ label: '', years: 0 })}>添加</button>
      </div>
    )}
  </form.Field>
)
```

Field API 的数组操作：`pushValue` / `insertValue` / `removeValue` / `swapValues` / `moveValue` / `replaceValue`。深路径 `hobbies[0].label` 自动类型安全。

## 5. 共享表单配置：`formOptions`

多个表单复用同一份 `defaultValues`/校验：

```tsx
const formOpts = formOptions({
  defaultValues: { firstName: '', lastName: '' } as Person,
})

const form = useForm({ ...formOpts, onSubmit: ... })
const form2 = useForm({ ...formOpts, onSubmit: ... })
```

## 6. 组件化封装：`createFormHook`

把 `form.Field`/`form.Subscribe` 替换成你自己的 `AppField`/`AppForm`，绑定统一的设计系统组件，告别 render-prop 样板：

```tsx
// form-context.tsx
import { createFormHook } from '@tanstack/react-form'
import { TextField } from './TextField'
import { SubmitButton } from './SubmitButton'

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: { TextField },
  formComponents: { SubmitButton },
  // context 来自 createFormHookContexts()
  fieldContext,
  formContext,
})
```

```tsx
const form = useAppForm({
  defaultValues: { email: '' },
  onSubmit: async ({ value }) => save(value),
})

<form.AppField component={TextField} name="email" validators={{ onChange: ... }} />
<form.AppForm component={SubmitButton} />
```

`withForm` 做类型安全的子表单拆分（把大表单的字段类型安全地传给子组件）。

## 7. 订阅与渲染优化

`form.Subscribe` 与 `field.state` 都基于细粒度 store。**只订阅需要的切片**避免多余渲染：

```tsx
// ✅ 只在 canSubmit/isSubmitting 变化时重渲染
<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>

// ❌ 订阅整个 state，任意值变化都重渲染
<form.Subscribe selector={(s) => s}>
```

hook 形式 `useStore(form.store, selector)` 或 `useSelector(form.store, selector)`（见 [../../data-and-forms/references/zustand.md](../../data-and-forms/references/zustand.md) 的 store 订阅模式）。

## 8. 与其他 skill 的关系

- **Zod / Standard Schema**：校验直接传 schema，见 [../../data-and-forms/references/zod.md](../../data-and-forms/references/zod.md)。
- **react-hook-form**：另一个表单库选型，见 [../../data-and-forms/references/react-hook-form.md](../../data-and-forms/references/react-hook-form.md)。TanStack Form 更偏 hook 原生、类型推导强、数组字段顺手；RHF 生态更成熟、注册式性能优。
- **nuqs**：表单值同步到 URL 见 [../../nuqs/references/core.md](../../nuqs/references/core.md)，可在 `onChange` 里 `setSearchParams`。
- **Server Actions**（[../../nextjs/references/server-actions.md](../../nextjs/references/server-actions.md)）：`onSubmit` 调 Server Action，`onServer` validator 回填服务端错误。

## 9. 速查

| 需求 | API |
|------|-----|
| 创建表单 | `useForm({ defaultValues, onSubmit, validators })` |
| 字段 | `<form.Field name validators>{(field) => ...}</form.Field>` |
| 字段值/错误 | `field.state.value` / `field.state.meta.errors` / `errorMap` |
| 改值/失焦 | `field.handleChange(v)` / `field.handleBlur()` |
| 同步校验 | `validators.onChange/onBlur/onSubmit` |
| 异步校验 | `validators.onChangeAsync/...` + `asyncDebounceMs` |
| Schema 校验 | `validators.onChange: zodSchema`（Standard Schema 原生） |
| 表单级设字段错 | form validator 返回 `{ fields: { name: 'msg' } }` |
| 数组字段 | `<form.Field name="hobbies">` + `pushValue/insertValue/removeValue` |
| 复用配置 | `formOptions({ defaultValues })` |
| 组件化封装 | `createFormHook({ fieldComponents, formComponents })` |
| 订阅切片 | `<form.Subscribe selector={(s) => [...]}>` |
| 阻止无效提交 | `canSubmit` + `isPristine` |
