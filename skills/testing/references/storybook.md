# Storybook 9

> 面向 `storybook@9`（2025 年稳定，2026 年持续维护）。组件开发隔离环境：把每个组件按"story"独立渲染、独立传参、独立交互，不依赖应用路由和数据。开发时当组件 workbench，测试时每个 story 自动成为一个测试用例（组件测试 / 交互测试 / 视觉回归 / a11y 审计）。

为什么用 Storybook 9：组件隔离开发（改一个组件不被整个应用拖累）、CSF（组件即代码，stories 可版本控制）、addon 生态（a11y 审计、viewport 模拟、主题切换、交互录制）、测试复用（同一份 story 驱动交互测试 + 视觉回归 + 单元测试）、文档自动生成（docs 由 stories 生成）。SB9 精简了 addon 生态（内置 Vitest 集成）、性能提升。

## 1. 安装

```bash
pnpm dlx storybook@latest init
# 手动：pnpm add -D storybook @storybook/react-vite
```

框架选 `@storybook/react-vite`（Vite 项目）或 `@storybook/nextjs`（Next.js 项目）。Next.js 框架包处理 `next/image`、`next/navigation`、RSC 等，免去手动 mock。

## 2. 目录与配置

```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       ├── Button.stories.tsx   ← story 定义
│       └── Button.test.tsx
└── .storybook/
    ├── main.ts                  ← 入口配置
    └── preview.ts               ← 全局装饰
```

```ts
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',    // docs/controls/actions/viewport/measure/outline
    '@storybook/addon-a11y',          // 可访问性审计
    '@storybook/addon-themes',        // 主题切换
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
}
export default config
```

```ts
// .storybook/preview.ts
import type { Preview } from '@storybook/react'
import { ThemeProvider } from 'next-themes'

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
}
export default preview
```

## 3. CSF 3：写 story

```tsx
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'          // SB9 内置（原 @storybook/test）
import { Button } from './Button'

const meta = {
  title: 'Components/Button',                 // 侧边栏路径
  component: Button,
  tags: ['autodocs'],                         // 自动生成文档
  args: {
    onClick: fn(),                            // action 记录到面板
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    label: '提交',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    label: '取消',
    variant: 'secondary',
  },
}

export const Disabled: Story = {
  args: {
    label: '禁用',
    disabled: true,
  },
}
```

> `satisfies Meta<typeof Button>` 保留精确类型，Controls 面板自动按 props 类型生成。每个导出的 `Story` 就是一个独立渲染状态。

## 4. CSF Next（preview，类型安全工厂）

SB9 引入 CSF Next（预览）——工厂函数链 `definePreview` → `preview.meta` → `meta.story`，每步类型安全，addon 类型自动推断：

```ts
// .storybook/main.ts
import { defineMain } from '@storybook/react-vite/node'

export default defineMain({
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
})
```

```ts
// .storybook/preview.ts
import { definePreview } from '@storybook/react-vite'
import addonA11y from '@storybook/addon-a11y'

export default definePreview({
  addons: [addonA11y()],
  parameters: { a11y: { options: { xpath: true } } },   // 类型安全
})
```

```tsx
// Button.stories.tsx
import preview from '#.storybook/preview'
import { Button } from './Button'

const meta = preview.meta({
  component: Button,
  parameters: { layout: 'centered' },          // 类型安全
})

export default meta

export const Primary = meta.story({
  args: { label: '提交', variant: 'primary' },
})

// 复用扩展
export const Large = Primary.extend({
  args: { ...Primary.args, size: 'large' },
})
```

> CSF Next 是 preview——API 可能变。生产项目仍建议用 CSF 3（稳定），CSF Next 用于评估。`preview.type.meta` 可显式指定类型（组件 props 之外的自定义 args）。

## 5. Controls：交互式调参

Controls 面板根据 `argTypes` 自动生成 UI 调参，无需写多个 story：

```tsx
argTypes: {
  variant: { control: 'select', options: ['primary', 'secondary'] },
  size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  disabled: { control: 'boolean' },
  label: { control: 'text' },
  onClick: { action: 'clicked' },
}
```

| control 类型 | 用途 |
|--------------|------|
| `text` / `number` / `boolean` | 基础类型 |
| `select` / `radio` | 枚举 |
| `color` | 颜色选择器 |
| `date` / `range` | 日期 / 范围 |
| `object` | JSON 编辑 |
| `file` | 文件上传 |

## 6. Play function：交互测试

story 的 `play` 函数在渲染后自动跑交互——既能在 Storybook UI 里看回放，也能被 test runner 跑成断言：

```tsx
import { expect } from 'storybook/test'
import { within, userEvent } from '@storybook/test'

export const SubmitForm: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    await step('填写表单', async () => {
      await user.type(canvas.getByLabel('邮箱'), 'ada@x.com')
      await user.type(canvas.getByLabel('密码'), 'secret')
    })

    await step('提交', async () => {
      await user.click(canvas.getByRole('button', { name: '登录' }))
      await expect(canvas.getByText('登录成功')).toBeInTheDocument()
    })
  },
}
```

> `canvasElement` 是 story 渲染的根节点，用 `within` 限定查询范围（避免多个 story 串）。`userEvent`/`expect` 从 `storybook/test` 导入（SB9 内置）。

## 7. Test Runner（CI 跑 stories）

`@storybook/test-runner` 把每个 story 当测试跑（play 函数 + a11y + 断言）：

```bash
pnpm add -D @storybook/test-runner

# 起 storybook + 跑测试
pnpm exec storybook dev --ci --port 6006 &
pnpm exec test-storybook
```

```ts
// .storybook/test-runner.ts
import { TestRunnerConfig } from '@storybook/test-runner'

const config: TestRunnerConfig = {
  async preVisit(page) {
    // 每个 story 访问前
  },
  async postVisit(page) {
    // 每个 story 访问后：可加 a11y 断言等
  },
}
export default config
```

> test runner 用 Playwright 驱动浏览器跑 stories。断言语法见 [playwright](playwright.md)。

## 8. addon-a11y（可访问性审计）

```ts
// .storybook/main.ts
addons: ['@storybook/addon-a11y']
```

每个 story 渲染后自动跑 axe-core 审计，违规在面板标红。配置审计级别：

```ts
// .storybook/preview.ts
parameters: {
  a11y: {
    config: {
      rules: [
        { id: 'color-contrast', enabled: true },
      ],
    },
    options: {},
  },
}
```

## 9. 视觉回归测试

每个 story 是天然的视觉测试用例。两种方案：

### Chromatic（推荐，官方）

[Chromatic](https://www.chromatic.com/) 是 Storybook 维护者的云服务，每个 commit 跑所有 story 截图对比：

```bash
pnpm add -D chromatic
pnpm exec chromatic --project-token=<token>
```

> Chromatic 处理跨浏览器/分辨率/字体渲染差异、动画冻结、抗 flaky。免费额度够小项目。

### 本地方案

`@storybook-visual-regression/addon` + CLI 本地截图对比，CI 自托管：

```bash
pnpm add -D @storybook-visual-regression/cli @storybook-visual-regression/addon
```

## 10. 常用 addon

| addon | 用途 |
|-------|------|
| `@storybook/addon-essentials` | docs + controls + actions + viewport + measure + outline（合集） |
| `@storybook/addon-a11y` | 可访问性审计 |
| `@storybook/addon-themes` | 主题切换（next-themes 等） |
| `@storybook/addon-viewport` | 响应式断点模拟（essentials 含） |
| `@storybook/addon-interactions` | play 函数录制与调试 |
| `@storybook/experimental-addon-test` | Vitest 集成（SB9） |

### Vitest 集成（SB9）

```ts
// .storybook/main.ts
addons: ['@storybook/experimental-addon-test']

// vitest.config.ts
import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin'

export default defineConfig({
  plugins: [react(), storybookTest({ configDir: '.storybook' })],
  test: { environment: 'jsdom' },
})
```

> SB9 内置 Vitest 集成，把 stories 当组件测试跑（无需 test-runner 起浏览器）。Vitest 配置见 [../foundation/references/vitest.md](../foundation/references/vitest.md)。

## 11. Next.js 集成

```ts
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  framework: { name: '@storybook/nextjs' },
  // Next.js 框架包自动处理 next/image、next/navigation、next/font
}
```

> `@storybook/nextjs` 处理 `next/image`（转 `<img>`）、`next/navigation`（mock router）、`next/font`（跳过字体加载）。Server Components 需在 story 里手动 `'use client'` 或用 `play` 测交互。RSC 边界见 [../nextjs/references/rsc-patterns.md](../nextjs/references/rsc-patterns.md)。

## 12. 与本仓库其他 skill 的衔接

- 组件单元测试用 Vitest + RTL，见 [vitest-react](vitest-react.md)；SB9 内置 Vitest 集成把 stories 当测试跑。
- E2E 测试用 Playwright，见 [playwright](playwright.md)；test-runner 底层也用 Playwright。
- antd 组件在 story 里渲染：`@storybook/nextjs` 或自定义 Provider 包装，见 [../ui/references/icon-and-theming.md](../ui/references/icon-and-theming.md)（ConfigProvider/主题）。
- 表单组件 story 用 `play` 测提交流程，RHF 细节见 [../data-and-forms/references/react-hook-form.md](../data-and-forms/references/react-hook-form.md)。
- API mock 在 story 里用 MSW handler 覆盖，见 [../data-and-forms/references/msw.md](../data-and-forms/references/msw.md)（同一份 handler 复用）。

## 13. 坑

| 坑 | 说明 |
|----|------|
| CSF Next 是 preview | 生产用 CSF 3；CSF Next API 可能变，评估时用 |
| `@storybook/test` 找不到 | SB9 内置为 `storybook/test`；老代码从 `@storybook/test` 导入仍兼容 |
| story 里用 `next/image` 报错 | 用 `@storybook/nextjs` 框架包；或手动 mock 成 `<img>` |
| RSC story 报 'use client' | story 渲染环境是客户端；组件加 `'use client'` 或拆出 client 子组件 |
| Controls 不显示 | `argTypes` 没配，或 `args` 没给默认值；`satisfies Meta<typeof Comp>` 会让 props 自动推断 |
| a11y 误报 | `parameters.a11y.config` 关闭某规则；别全局关 `color-contrast` |
| 视觉回归 flaky | 动画没冻结（Chromatic 自动冻结）；字体加载时序；用 Chromatic 抗 flaky |
| story 间状态串 | 每个 story 独立渲染，但全局 decorator 的单例（如 store）会串；`keys` 隔离或每 story 重置 |
| `play` 函数不跑 | UI 模式手动点"rerun"；CI 用 test-runner 或 Vitest 集成 |
| test-runner 找不到 story | storybook dev 没起 / 端口不对；配 `--url` |
| addon-essentials 重复装 | 单独装 docs/actions 等会冲突；只装 essentials |
| SB9 升级后 addon 不兼容 | SB9 精简了 addon；跑 `npx storybook@latest upgrade` 自动迁移 |
