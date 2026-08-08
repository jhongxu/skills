# Zod 4

> 面向 `zod@4`（2025 年稳定发布，最新 4.3.x）。TypeScript 优先的 schema 校验库。定义一次 schema，同时拿到：运行时校验、TypeScript 类型推断、错误信息。React 栈中表单校验、API 入参校验、环境变量解析的事实标准。

为什么升 v4：性能飞跃（字符串解析快 14x、对象快 6.5x、`tsc` 类型实例化减少 100x）、API 统一（四个错误选项合并为一个 `error`）、Standard Schema 规范支持、Zod Mini（极致 tree-shaking）。Zod 3 已功能冻结（仅安全修复），新项目应直接用 v4。

## 1. 安装

```bash
pnpm add zod@^4
```

要求 TypeScript 5.5+。

```ts
import { z } from 'zod'   // v4 默认导出
```

## 2. 基础用法

```ts
import { z } from 'zod'

const User = z.object({
  id: z.uuid(),                       // v4: 顶层函数（非 z.string().uuid()）
  name: z.string().min(1, { error: '名称必填' }),   // v4: error 参数
  email: z.email('请输入合法邮箱'),                 // 顶层格式 + 简写 message
  age: z.number().int().min(18),
  role: z.enum(['admin', 'user']),    // 也支持 z.enum(NativeEnum)
  tags: z.array(z.string()).optional(),
})

type User = z.infer<typeof User>      // 类型自动推断

// 解析：失败抛错
const user = User.parse(rawData)

// 安全解析：返回结果对象
const result = User.safeParse(rawData)
if (!result.success) {
  console.log(result.error.issues)    // 标准化的问题数组
} else {
  console.log(result.data)            // 类型为 User
}
```

## 3. v4 核心变化（从 v3 迁移）

### 3.1 字符串格式升至顶层

v4 把字符串格式从 `.method()` 链式调用改为顶层 tree-shakeable 函数。旧写法仍可用（deprecated，会警告）：

```ts
// v4（推荐）
z.email()
z.uuid()
z.url()
z.ipv4()
z.base64()
z.iso.datetime()
z.iso.date()

// v3（deprecated，仍可用）
z.string().email()
z.string().uuid()
```

> 原因：tree-shaking。只用 email 校验的包不再打包所有格式的代码。

### 3.2 统一的 `error` 参数

四个错误选项合并为一个 `error`：

```ts
// v4: error 可以是字符串或函数
z.string({ error: '必填' })
z.string({
  error: (issue) => issue.input === undefined ? '必填' : '必须是文本',
})

z.string().min(5, { error: '太短' })
z.string().min(5, {
  error: (issue) => issue.code === 'too_small' ? `必须 >${issue.minimum}` : undefined,
})
```

| v3 | v4 |
|----|-----|
| `message: '...'` | `error: '...'` |
| `invalid_type_error` / `required_error` | `error: (issue) => issue.input === undefined ? '必填' : '类型错误'` |
| `errorMap` | `error`（可返回字符串或 `undefined` 让出控制权） |

### 3.3 错误格式化移到顶层函数

```ts
import { z } from 'zod'

const result = User.safeParse(rawData)
if (!result.success) {
  z.flattenError(result.error)     // { formErrors, fieldErrors } —— 表单友好
  z.treeifyError(result.error)     // 嵌套对象，镜像 schema 形状
  z.prettifyError(result.error)    // 人类可读多行字符串，给日志
}
```

| v3（deprecated） | v4 |
|------------------|-----|
| `error.format()` | `z.treeifyError(error)` |
| `error.flatten()` | `z.flattenError(error)` |

### 3.4 对象 API 变化

```ts
// 严格/宽松对象：从方法改为构造函数
z.strictObject({ ... })   // v4（替代 z.object({...}).strict()）
z.looseObject({ ... })    // v4（替代 z.object({...}).passthrough()）

// merge 弃用，用 extend
A.extend(B.shape)         // v4（替代 A.merge(B)）

// catchall
z.object({}).catchall(z.unknown())
```

### 3.5 其他重要变化

| 变化 | 说明 |
|------|------|
| `z.nativeEnum()` | 弃用；`z.enum()` 直接接受 TypeScript enum |
| `.deepPartial()` | 移除；用 `z.partial()` 递归或手动 |
| `.int()` | 只接受安全整数 |
| `z.int()` | 顶层函数 |
| `.default()` | 行为变化（更严格的类型推断） |
| `z.record()` | 签名变化（key 类型现在必填） |
| `z.string().cidr()` | 移除 |

> 社区 codemod：`npx zod-v3-to-v4` 可辅助批量迁移。Zod 3 API 在 v4 中大多仍可用（deprecated 警告），可渐进迁移。

## 4. 常用 schema 速查

```ts
// 基础类型
z.string()
z.number()
z.boolean()
z.bigint()
z.date()
z.symbol()
z.null()
z.undefined()
z.nullable(schema)         // v4: 函数式（Mini 友好）
z.optional(schema)
z.nullish(schema)          // null | undefined

// 字面量与枚举
z.literal('foo')
z.enum(['a', 'b', 'c'])
z.enum(NativeEnum)         // TypeScript enum

// 复合
z.object({ ... })
z.array(schema)
z.tuple([a, b])
z.union([a, b])
z.discriminatedUnion('type', [a, b])   // 性能更好的 union
z.record(z.string(), z.number())       // Record<string, number>
z.map(keySchema, valueSchema)
z.set(valueSchema)
z.promise(schema)

// 函数
z.function(argsSchema, returnsSchema)
```

## 5. refine 与 transform

```ts
// 自定义校验（v4 推荐 .check()，.refine() 仍可用）
const Password = z.string().min(8).check((ctx) => {
  if (!/[A-Z]/.test(ctx.value)) {
    ctx.issues.push({ message: '需要至少一个大写字母' })
  }
})

// transform：输入类型 ≠ 输出类型
const schema = z.string().transform((s) => s.length)   // string → number
type Input = z.input<typeof schema>   // string
type Output = z.output<typeof schema> // number

// 带默认值
const withDefault = z.string().default('hello')
```

## 6. Zod Mini（`zod/mini`）

bundle 敏感场景（客户端、edge function）用 Mini 构建。同一 core，函数式 API，极致 tree-shaking：

```ts
import * as z from 'zod/mini'

// 函数式包装，替代链式 .optional()
const User = z.object({
  id: z.string(),
  name: z.optional(z.string()),
  age: z.number(),
})

// .check() 替代 .refine()
const Email = z.string().check((ctx) => {
  if (!ctx.value.includes('@')) {
    ctx.issues.push({ message: '非法邮箱' })
  }
})
```

| 全量 zod | zod/mini |
|----------|----------|
| `z.string().optional()` | `z.optional(z.string())` |
| `.refine()` | `.check()` |
| 链式方法 | 函数式包装 |

> 运行时行为与全量版完全一致，共享同一 core。体积更小但写法更啰嗦。

## 7. Standard Schema 规范

Zod 4 实现了 [Standard Schema](https://standardschema.dev/) 规范——一个跨校验库的通用接口。库作者接受用户自定义 schema 时，无需绑定 Zod，只要接受 Standard Schema 即可（Zod、Valibot、ArkType 等都实现了）：

```ts
// 任意符合 Standard Schema 的 schema
import type { StandardSchema } from '@standard-schema/spec'

function validate<T>(input: unknown, schema: StandardSchema<T>) {
  const result = schema['~standard'].validate(input)
  if ('issues' in result) {
    throw new Error(result.issues[0]?.message)
  }
  return result.value
}
```

> TanStack Form、TanStack Router 已支持 Standard Schema。React Hook Form 通过 `@hookform/resolvers` 的 standard-schema resolver 支持。见 [../tanstack/references/form.md](../tanstack/references/form.md)。

## 8. 版本化与子路径

```ts
// 永久固定子路径（库作者用）
import * as z4 from 'zod/v4/core'   // Zod 4 core，未来大版本也保留
import * as z3 from 'zod/v3'        // Zod 3，永久可用

// 应用代码直接用
import { z } from 'zod'             // v4.x 导出 v4；v3.x 导出 v3
```

库作者 peerDependencies 建议 `"zod": "^4.0.0"`（新库只支持 v4）或 `"zod": "^3.25.0 || ^4.0.0"`（双支持，`3.25.0` 起提供 `zod/v4` 子路径）。

## 9. 与本仓库其他 skill 的衔接

- 表单校验：TanStack Form 见 [../tanstack/references/form.md](../tanstack/references/form.md)；React Hook Form 见 [react-hook-form](react-hook-form.md)。
- Server Actions 入参校验见 [../nextjs/references/server-actions.md](../nextjs/references/server-actions.md)。
- tRPC procedure input 校验见 [trpc](trpc.md)。
- TanStack Router search params 见 [../tanstack/references/router.md](../tanstack/references/router.md)（注意 Zod 4 与 search param adapter 有兼容问题，见下方坑表）。
- nuqs JSON + 校验见 [../nuqs/references/parsers-community-zod.md](../nuqs/references/parsers-community-zod.md)。

## 10. 坑

| 坑 | 说明 |
|----|------|
| `z.string().email()` 报 deprecated 警告 | v4 改 `z.email()`；旧写法仍可用 |
| `message` 参数报 deprecated | v4 改 `error`；旧写法仍可用 |
| `error.format()` / `.flatten()` 报 deprecated | v4 改 `z.treeifyError()` / `z.flattenError()` |
| `z.object({...}).strict()` 报 deprecated | v4 改 `z.strictObject({...})` |
| `z.record(z.number())` 类型报错 | v4 的 `z.record()` key 类型必填：`z.record(z.string(), z.number())` |
| `.deepPartial()` 不存在了 | v4 移除；手动递归或用 `z.partial()` |
| TanStack Router search param adapter 与 Zod 4 兼容问题 | Zod 4 改了 issue 结构，旧版 adapter 解析报错；用 Standard Schema adapter 或升级 adapter |
| `tsc` 在大 schema 项目慢 | 升 v4（类型实例化减少 100x）；避免过多 `.extend()` 链 |
| Mini 与全量混用 | 别混用；同一项目选一个。两者 core 一致但 helper 方法不同 |
| 库依赖 `zod` 主入口 | 库应 import `zod/v4/core`（永久固定），避免主入口在不同大版本间漂移 |
| `z.enum(NativeEnum)` 类型推断丢值 | v4 已修复，`z.nativeEnum()` 弃用后用 `z.enum()` 即可 |
