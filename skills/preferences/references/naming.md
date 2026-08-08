# Naming

> 个人命名偏好——文件、代码标识符、分支统一规则。参考 antfu 风格：文件 kebab-case、代码 camelCase/PascalCase、语义优先。目标是消除"这个该叫啥"的决策成本，全仓库一致。

## 1. 文件与目录

| 类型 | 规则 | 示例 |
|------|------|------|
| 文件 | kebab-case | `user-profile.tsx`、`use-auth.ts` |
| 目录 | kebab-case | `components/user-card/`、`features/auth/` |
| 测试 | `{name}.test.tsx` | `button.test.tsx` |
| Story | `{name}.stories.tsx` | `button.stories.tsx` |
| 类型定义 | `{name}.d.ts` 或 `{name}.types.ts` | `env.d.ts`、`user.types.ts` |
| 配置 | `{tool}.config.ts` | `vite.config.ts`、`eslint.config.ts` |
| 常量模块 | kebab-case | `api-routes.ts` |

```tsx
// ✅ kebab-case 文件名
components/
├── user-card/
│   ├── index.ts
│   ├── user-card.tsx
│   └── user-card.test.tsx
└── data-table.tsx            # 单文件组件

// ❌ PascalCase 文件名
components/
├── UserCard/
│   └── UserCard.tsx
└── DataTable.tsx
```

> 为什么 kebab-case：跨文件系统大小写一致（macOS 默认不敏感、Linux 敏感），避免 `UserCard` vs `usercard` 冲突；URL 友好；antfu eslint 默认规则。组件**标识符**仍 PascalCase（`UserCard`），只是**文件名** kebab-case（`user-card.tsx`）。

### 例外

| 场景 | 规则 | 示例 |
|------|------|------|
| Next.js App Router 路由 | 文件名即 URL 段，约定优先 | `app/users/[id]/page.tsx` |
| Next.js 动态路由 | `[param]` / `[...slug]` | `[id]/page.tsx` |
| `.d.ts` 声明文件 | 保持工具约定 | `env.d.ts`、`global.d.ts` |

## 2. 代码标识符

### 变量与函数

```ts
// camelCase
const userName = 'ada'
function fetchUserById(id: string) { ... }
const isLoading = true
```

### 组件

```tsx
// PascalCase（与文件名 kebab-case 解耦）
import { UserCard } from './user-card'

export function UserCard({ user }: UserCardProps) {
  return <div>{user.name}</div>
}
```

### 类型与接口

```ts
// PascalCase；优先 type，interface 仅用于可扩展对象
type User = {
  id: string
  name: string
}

// 需要声明合并时用 interface
interface Theme {
  colors: Record<string, string>
}
interface Theme {  // 合并
  spacing: Record<string, number>
}
```

> 默认 `type`（更灵活、无声明合并陷阱）；只在需要 declaration merging（如库插件扩展）时用 `interface`。antfu eslint 不强制 type vs interface，但保持项目内一致。

### Hooks

```ts
// use 前缀 + camelCase
function useAuth() { ... }
function useUserPermissions(userId: string) { ... }
```

### 常量

```ts
// 顶级常量：camelCase（antfu 风格，非 UPPER_SNAKE）
const maxRetries = 3
const defaultPageSize = 20

// 真正的枚举值：PascalCase 或 camelCase
type Status = 'active' | 'inactive' | 'pending'
```

> antfu 风格不用 `UPPER_SNAKE_CASE`（除环境变量）。`maxRetries` 比 `MAX_RETRIES` 更贴合 JS 习惯。

### 环境变量

```bash
# UPPER_SNAKE_CASE（系统约定）
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://...
```

### 布尔

```ts
// is/has/can/should 前缀，表意清晰
const isLoading = true
const hasPermission = false
const canEdit = true
const shouldRedirect = false
```

## 3. React 特定

### Props 类型

```tsx
// PascalCase + Props 后缀
type ButtonProps = {
  label: string
  variant?: 'primary' | 'secondary'
  onClick?: () => void
}

// 组件内解构
function Button({ label, variant = 'primary', onClick }: ButtonProps) { ... }
```

### 事件 handler

```tsx
// handle{Event} 命名 handler，on{Event} 命名 props
type ButtonProps = {
  onClick?: () => void       // prop：on 前缀
}

function Form() {
  const handleSubmit = () => { ... }   // 内部：handle 前缀
  return <Button onClick={handleSubmit} />
}
```

### 组件目录入口

```ts
// components/user-card/index.ts
export { UserCard } from './user-card'
export type { UserCardProps } from './user-card'
```

> `index.ts` 只重导出公开 API。`import { UserCard } from '@/components/user-card'`（不写 `/index`）。

## 4. CSS / 样式

```tsx
// UnoCSS / Tailwind：kebab-case class
<div className="flex items-center gap-4 bg-white" />

// StyleX：camelCase key（JS 对象）
const styles = stylex.create({
  card: { display: 'flex', backgroundColor: 'white' },
  title: { fontSize: '1.5rem' },
})

// CSS Modules：kebab-case 文件名
user-card.module.css
```

> StyleX 细节见 [../stylex/references/styling.md](../stylex/references/styling.md)；UnoCSS 见 [../foundation/references/unocss.md](../foundation/references/unocss.md)。

## 5. Git 分支

```
# kebab-case，type/描述 前缀
feat/user-auth
fix/login-redirect
refactor/data-table
chore/deps-update
docs/api-reference
```

## 6. API 路由 / tRPC

```ts
// tRPC：router.procedure 用 camelCase
export const appRouter = router({
  user: router({
    getById: publicProcedure.query(...),    // camelCase
    createPost: publicProcedure.mutation(...),
  }),
})

// REST 路由：kebab-case URL
GET /api/user-profiles/:id
POST /api/auth/login
```

> tRPC 细节见 [../data-and-forms/references/trpc.md](../data-and-forms/references/trpc.md)。

## 7. 速查表

| 对象 | 规则 | 示例 |
|------|------|------|
| 文件 | kebab-case | `user-card.tsx` |
| 目录 | kebab-case | `features/auth/` |
| 变量/函数 | camelCase | `fetchUser` |
| 组件 | PascalCase | `UserCard` |
| 类型/接口 | PascalCase | `User`、`ButtonProps` |
| Hooks | `use` + camelCase | `useAuth` |
| 常量 | camelCase | `maxRetries` |
| 环境变量 | UPPER_SNAKE | `DATABASE_URL` |
| 布尔 | `is/has/can/should` 前缀 | `isLoading` |
| 事件 handler | `handle{Event}` | `handleSubmit` |
| 事件 prop | `on{Event}` | `onClick` |
| CSS class | kebab-case | `flex items-center` |
| 分支 | `type/kebab-desc` | `feat/user-auth` |
| tRPC procedure | camelCase | `getById` |

## 8. 坑

| 坑 | 说明 |
|----|------|
| 文件名 PascalCase（`UserCard.tsx`） | 改 kebab-case；跨系统大小写一致 |
| `UPPER_SNAKE` 常量 | antfu 风格用 camelCase（环境变量除外） |
| `interface` 泛滥 | 默认 `type`；只在声明合并时用 `interface` |
| 布尔无前缀（`loading`、`permission`） | 加 `is/has/can/should` 前缀 |
| handler 命名混乱（`click` / `onClick` / `handleClick`） | prop 用 `on{Event}`，内部用 `handle{Event}` |
| 文件名与组件名不一致 | 文件 `user-card.tsx`，组件 `UserCard`——这是有意的（kebab 文件 + Pascal 组件） |
| 路由用 PascalCase | Next.js App Router 路由文件小写：`page.tsx`、`layout.tsx` |
| type/interface 混用 | 项目内统一选一个为默认；保持一致 |
