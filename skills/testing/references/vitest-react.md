# Vitest + React Testing Library

> 面向 `vitest@3` + `@testing-library/react@16` + `@testing-library/user-event@14`。组件测试（unit/component）的事实标准：Vitest 当 runner，React Testing Library（RTL）渲染组件并以"用户视角"查询 DOM。不测实现细节（state/内部方法），只测渲染输出与交互行为——重构不破测试。

Vitest runner 基础（projects、pool、mock、coverage、浏览器模式、类型测试）见 [../foundation/references/vitest.md](../foundation/references/vitest.md)。本篇只讲 React 组件测试特有部分。

## 1. 安装

```bash
pnpm add -D vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  jsdom
```

- `@vitejs/plugin-react`：让 Vitest 用 Vite 的 React 管线（JSX/Fast Refresh 转换）
- `jsdom`：Node 里模拟浏览器 DOM。替代 `happy-dom`（更快，但兼容性略差）
- `@testing-library/jest-dom`：自定义 matcher（`toBeInTheDocument` 等）
- `@testing-library/user-event`：模拟真实用户交互（v14 必须 `await`）

## 2. 配置

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',          // 或 'happy-dom'
    globals: true,                 // describe/it/expect 不用 import
    setupFiles: ['./src/test/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
})
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest'   // 注册 matchers
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()   // 每个测试后卸载 DOM，防止测试间串数据
})
```

```ts
// src/test/setup.ts —— Next.js 项目常见 mock
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}))
```

## 3. 第一个组件测试

```tsx
// Button.tsx
export function Button({ label, onClick, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} aria-disabled={disabled}>
      {label}
    </button>
  )
}

// Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('渲染 label', () => {
    render(<Button label="提交" />)
    expect(screen.getByRole('button', { name: '提交' })).toBeInTheDocument()
  })

  it('点击触发 onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button label="提交" onClick={onClick} />)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('disabled 时不触发', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button label="提交" onClick={onClick} disabled />)
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
```

## 4. 查询优先级（RTL 核心）

RTL 的查询按"用户感知方式"排序，优先用 accessibility 友好的：

| 优先级 | 方法 | 示例 | 用途 |
|--------|------|------|------|
| 1 | `getByRole` | `getByRole('button', { name: '提交' })` | 首选，匹配 ARIA role + accessible name |
| 2 | `getByLabel` | `getByLabel('邮箱')` | 表单控件按 label |
| 3 | `getByPlaceholder` | `getByPlaceholder('请输入')` | input 占位符 |
| 4 | `getByText` | `getByText('登录')` | 静态文本 |
| 5 | `getByDisplayValue` | `getByDisplayValue('ada@x.com')` | input 当前值 |
| 6 | `getByAltText` | `getByAltText('头像')` | 图片 alt |
| 7 | `getByTitle` | `getByTitle('详情')` | title 属性 |
| 8 | `getByTestId` | `getByTestId('user-card')` | 兜底（无语义时） |

> 原则：能 `getByRole` 就别 `getByTestId`。前者同时验证了可访问性——role/name 缺失时测试会失败，倒逼 a11y 正确。

### 查询变体

| 前缀 | 匹配 0 | 匹配 1 | 匹配多个 |
|------|--------|--------|----------|
| `getBy*` | 抛错 | 返回 | 抛错 |
| `queryBy*` | 返回 null | 返回 | 抛错 |
| `findBy*` | reject | resolve | reject |
| `getAllBy*` | 抛错 | 返回数组 | 返回数组 |
| `queryAllBy*` | 返回 [] | 返回数组 | 返回数组 |
| `findAllBy*` | reject | resolve 数组 | resolve 数组 |

- `queryBy*`：断言"不存在"（`expect(queryByText('x')).not.toBeInTheDocument()`）
- `findBy*`：异步等待元素出现（返回 Promise，配合 `await`）

## 5. `userEvent` v14（真实用户模拟）

v14 必须 `setup()` 并 `await` 每个动作——模拟真实事件序列（focus → keydown → input → keyup）：

```tsx
const user = userEvent.setup()

// 输入
await user.type(screen.getByRole('textbox'), 'hello')

// 清空
await user.clear(screen.getByRole('textbox'))

// 点击
await user.click(screen.getByRole('button'))

// 勾选
await user.click(screen.getByRole('checkbox'))

// 选择 option
await user.selectOptions(screen.getByRole('combobox'), 'apple')

// 上传文件
await user.upload(screen.getByLabelText('头像'), file)

// 键盘
await user.keyboard('{Shift>}A{/Shift}')   // 按住 Shift 输入 A
```

> 别用 `fireEvent`（底层直接派发事件，跳过浏览器中间行为）。`userEvent` 模拟真实用户，更接近生产行为。`fireEvent` 仅在 `userEvent` 不支持时兜底。

## 6. 测试异步

```tsx
import { render, screen, waitFor } from '@testing-library/react'

it('加载后显示数据', async () => {
  render(<UserList />)
  expect(screen.getByText('加载中…')).toBeInTheDocument()

  // findBy* 等待元素出现（推荐）
  expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()

  // waitFor 等待任意断言
  await waitFor(() => {
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })
})
```

| 方式 | 场景 |
|------|------|
| `await findBy*` | 等单个元素出现 |
| `await waitFor(() => ...)` | 等复杂条件（多个元素、非 DOM 状态） |
| `waitForElementToBeRemoved` | 等 loading 消失 |

> API mock 用 MSW 拦截 fetch，见 [../data-and-forms/references/msw.md](../data-and-forms/references/msw.md)。别 mock 整个模块——网络边界拦截更接近真实。

## 7. 测试 Hooks：`renderHook`

```tsx
import { renderHook, act } from '@testing-library/react'

it('useCounter 自增', () => {
  const { result } = renderHook(() => useCounter({ initial: 0 }))

  expect(result.current.count).toBe(0)

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})
```

> 状态更新必须包在 `act()` 里，否则 React 警告"state update not wrapped in act"。`userEvent` 内部已包 `act`，只有直接调 hook 返回的函数时才需手动包。

## 8. 自定义 render（包装 Provider）

组件依赖 Router/Theme/Query 等 Provider 时，封装一个自定义 `render`：

```tsx
// src/test/utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { ReactElement } from 'react'

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },   // 测试不重试
  })
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  )
}

export function render(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react')   // 重导出 screen 等
```

```tsx
// 用自定义 render
import { render, screen } from '@/test/utils'
import { Profile } from './Profile'

it('显示用户名', () => {
  render(<Profile />)
  expect(screen.getByText('Ada')).toBeInTheDocument()
})
```

> TanStack Query 测试配置见 [../tanstack/references/query.md](../tanstack/references/query.md)：`retry: false`、`gcTime: 0` 避免测试间串缓存。

## 9. 测试表单（RHF）

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('提交表单', async () => {
  const onSubmit = vi.fn()
  render(<LoginForm onSubmit={onSubmit} />)

  const user = userEvent.setup()
  await user.type(screen.getByLabel('邮箱'), 'ada@x.com')
  await user.type(screen.getByLabel('密码'), 'secret123')
  await user.click(screen.getByRole('button', { name: '登录' }))

  expect(onSubmit).toHaveBeenCalledWith({
    email: 'ada@x.com',
    password: 'secret123',
  })
})
```

> RHF 细节见 [../data-and-forms/references/react-hook-form.md](../data-and-forms/references/react-hook-form.md)。校验错误用 `findByText` 等异步出现。

## 10. 常用 `jest-dom` matcher

```tsx
expect(el).toBeInTheDocument()              // 在 DOM 中
expect(el).toBeVisible()                    // 可见（非 display:none / hidden）
expect(el).toBeDisabled() / .toBeEnabled()
expect(el).toHaveTextContent('hello')       // 文本内容
expect(el).toHaveValue('ada')               // 表单值
expect(el).toHaveClass('btn-primary')       // class
expect(el).toHaveAttribute('href', '/x')    // 属性
expect(el).toHaveFocus()                    // 聚焦
expect(el).toBeChecked()                    // 勾选
expect(el).toHaveErrorMessage('必填')        // aria-errormessage（v6+）
```

## 11. 与本仓库其他 skill 的衔接

- Vitest runner 配置见 [../foundation/references/vitest.md](../foundation/references/vitest.md)。
- API mock 见 [../data-and-forms/references/msw.md](../data-and-forms/references/msw.md)。
- TanStack Query 测试见 [../tanstack/references/query.md](../tanstack/references/query.md)。
- 表单测试见 [../data-and-forms/references/react-hook-form.md](../data-and-forms/references/react-hook-form.md)。
- E2E 测试用 Playwright，见 [playwright](playwright.md)。
- 组件开发/视觉回归用 Storybook，见 [storybook](storybook.md)。

## 12. 坑

| 坑 | 说明 |
|----|------|
| `not wrapped in act` 警告 | 状态更新没包 `act()`；`userEvent` 已内置，直接调 hook 函数需手动包 |
| `getBy*` 报"multiple elements" | 匹配到多个；改 `getAllBy*` 或收紧查询条件 |
| 异步元素找不到 | 同步 `getBy*` 在异步渲染前跑；改 `await findBy*` |
| `toBeInTheDocument` 不是函数 | setup.ts 没 `import '@testing-library/jest-dom/vitest'` |
| `userEvent.click` 没 await | v14 全异步，必须 `await user.click(...)` |
| 用 `fireEvent` 代替 `userEvent` | `fireEvent` 跳过浏览器行为（focus、键盘序列）；优先 `userEvent` |
| Provider 缺失报错 | 用自定义 `render` 包 Provider，别在每个测试里重复包 |
| Next.js 组件报 `useRouter` 不存在 | setup.ts mock `next/navigation`、`next/image` |
| 测试串数据 | `afterEach(cleanup)` 清 DOM；QueryClient 每测试新建 |
| `findBy*` 超时 | 默认 1000ms；调 `findByX(..., {}, { timeout: 3000 })` 或查 mock 是否返回 |
| 快照测 DOM | `toMatchSnapshot()` 脆弱（改 class 就挂）；优先行为断言 |
