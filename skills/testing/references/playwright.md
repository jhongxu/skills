# Playwright

> 面向 `@playwright/test@1.55+`（2026 线到 1.60）。端到端（E2E）测试事实标准：一个 API 驱动 Chromium / Firefox / WebKit，内置自动等待、web-first 断言、trace viewer、并行 sharding。测的是真实浏览器里跑完整应用——登录、跳转、网络、渲染全都过一遍，最接近用户。

为什么用 Playwright：跨浏览器（Chromium/Firefox/WebKit 一套代码）、auto-waiting（点之前自动等元素可见/可用/稳定，告别 `sleep`）、web-first 断言（断言会重试直到超时，消除时序 flaky）、codegen（录操作生成代码）、trace viewer（失败时回放完整时间线含网络/控制台/截图）、原生并发（worker 进程并行 + CI sharding）。

> 单元/组件测试用 Vitest + RTL，见 [vitest-react](vitest-react.md)。E2E 才用 Playwright——慢但真实。两者互补，不替代。

## 1. 安装

```bash
pnpm create playwright@latest
# 或手动：pnpm add -D @playwright/test && pnpm exec playwright install
```

`playwright install` 下载浏览器二进制（Chromium/Firefox/WebKit）。CI 里缓存 `~/.cache/ms-playwright`。

## 2. 配置

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,                  // 文件级并行
  forbidOnly: !!process.env.CI,         // CI 禁 test.only
  retries: process.env.CI ? 2 : 0,      // CI 重试 2 次
  workers: process.env.CI ? 4 : undefined,  // CI 限制 worker 数
  reporter: [['html'], ['list']],       // HTML 报告 + 终端列表
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',            // 首次重试才录 trace（省资源）
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 15'] } },
  ],
  webServer: {                          // 自动起 dev server
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

> `trace: 'on-first-retry'` 是 2026 推荐默认：trace 录制昂贵，绿时不录、挂了重试时才录，诊断数据恰好出现在需要时。

## 3. 第一个测试

```ts
// e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test('登录流程', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('邮箱').fill('ada@x.com')
  await page.getByLabel('密码').fill('secret123')
  await page.getByRole('button', { name: '登录' }).click()

  // web-first 断言：自动重试直到条件满足或超时
  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByRole('heading', { name: '欢迎' })).toBeVisible()
})
```

## 4. Locators（定位器）

Locator 是 Playwright 的核心——**懒求值**（创建时不查 DOM，交互时才查）、**自动重试**（元素没准备好就一直试到超时）。不再需要 `waitForSelector`。

### 推荐优先级

| 方法 | 示例 | 何时用 |
|------|------|--------|
| `getByRole` | `getByRole('button', { name: '提交' })` | 首选，匹配 ARIA role + accessible name |
| `getByLabel` | `getByLabel('邮箱')` | 表单控件按 label |
| `getByPlaceholder` | `getByPlaceholder('请输入')` | input 占位符 |
| `getByText` | `getByText('登录')` | 静态文本 |
| `getByAltText` | `getByAltText('头像')` | 图片 alt |
| `getByTitle` | `getByTitle('详情')` | title 属性 |
| `getByTestId` | `getByTestId('user-card')` | 兜底（无语义时） |

```ts
// 链式收窄
const item = page.getByRole('listitem').filter({ hasText: 'Ada' })
const button = page.getByRole('button').and(page.getByTitle('订阅'))

// 在某容器内查
const form = page.getByRole('form', { name: '登录' })
await form.getByLabel('邮箱').fill('ada@x.com')
```

### 2026 版本变化

| 版本 | 变化 |
|------|------|
| v1.58 | 移除 `_react` / `_vue` selector 引擎、`:light` 后缀 |
| v1.59 | `page.pickLocator()`（headed 模式可视化选择器）、`locator.normalize()`（CSS/XPath 转 ARIA）、`getByRole` 增 `description` 选项 |
| v1.60 | `locator.drop()`（模拟文件拖放）、ARIA 快照增强（`boxes: true`、`mode: 'ai'`）、`expect(page).toMatchAriaSnapshot()` |

```ts
// v1.58+：_react 不再可用，改 getByRole
// ❌ page.locator('_react=BookItem[author="Kafka"]')
// ✅ page.getByRole('listitem').filter({ hasText: 'Kafka' })

// v1.59：description 选项
await page.getByRole('button', { name: '提交', description: '发送表单数据' }).click()
```

## 5. Web-first 断言

断言会**重试直到条件满足或超时**（默认 5s），消除手动 `waitFor`：

```ts
await expect(page.getByRole('button')).toBeVisible()
await expect(page.getByRole('button')).toBeEnabled()
await expect(page.getByRole('heading')).toHaveText('欢迎')
await expect(page.getByRole('listitem')).toHaveCount(3)
await expect(page.getByRole('alert')).toContainText('已添加')
await expect(page).toHaveURL('/dashboard')
await expect(page).toHaveTitle('控制台')
await expect(page.getByRole('textbox')).toHaveValue('ada@x.com')
await expect(page.getByRole('checkbox')).toBeChecked()
```

> 普通断言（`expect(value).toBe(...)`）不重试。DOM 断言一定用 `expect(locator)` 形式。

## 6. 自动等待

所有动作（`click`/`fill`/`press`）执行前自动检查：元素已挂载、可见、稳定（非动画中）、可接收事件、启用。无需手动 `waitFor`：

```ts
// 不需要这样
await page.waitForSelector('.btn')
await page.click('.btn')

// 直接这样
await page.getByRole('button', { name: '提交' }).click()
```

## 7. 认证状态复用（storageState）

登录慢，每个测试重复登录浪费时间。登录一次存 session，后续测试直接加载：

```ts
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test'

setup('登录', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('邮箱').fill(process.env.TEST_USER!)
  await page.getByLabel('密码').fill(process.env.TEST_PASS!)
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL('/dashboard')
  await page.context().storageState({ path: 'e2e/.auth/user.json' })
})
```

```ts
// playwright.config.ts
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    dependencies: ['setup'],
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'e2e/.auth/user.json',   // 复用登录态
    },
  },
]
```

> 把 `e2e/.auth/` 加进 `.gitignore`，别提交 session。

## 8. 测试夹具（fixtures）

```ts
import { test as base, expect } from '@playwright/test'

// 自定义 fixture：封装常用页面对象
type AppFixtures = {
  loginPage: LoginPage
  dashboard: DashboardPage
}

export const test = base.extend<AppFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  dashboard: async ({ page }, use) => {
    await use(new DashboardPage(page))
  },
})

// 用
test('登录', async ({ loginPage, dashboard }) => {
  await loginPage.navigate()
  await loginPage.login('ada@x.com', 'secret')
  await expect(dashboard.heading).toBeVisible()
})
```

## 9. 网络拦截与 mock

```ts
// 拦截 API 返回 mock 数据
await page.route('**/api/users', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, name: 'Ada' }]),
  })
})

// 拦截失败
await page.route('**/api/users', (route) =>
  route.fulfill({ status: 500 })
)

// 放行其余请求
await page.route('**/*', (route) => route.continue())
```

> 单元测试的 API mock 用 MSW 更合适，见 [../data-and-forms/references/msw.md](../data-and-forms/references/msw.md)。E2E 里用 `page.route` 拦截整个浏览器请求。

## 10. 调试工具

```bash
npx playwright codegen localhost:3000        # 录操作生成代码
npx playwright codegen --auth=user:pass url  # 带认证录制
npx playwright test --ui                      # UI 模式（时间线、watch、picker）
npx playwright test --debug                   # 步进调试（Inspector + pause）
npx playwright test --trace on                # 录 trace
npx playwright show-report                    # 看 HTML 报告
npx playwright show-trace trace.zip           # 看 trace 回放
npx playwright test --last-failed             # 只跑上次失败的（2026 新增）
npx playwright test --grep @smoke             # 按 tag 过滤
```

> UI 模式（`--ui`）是 2026 主推的日常开发工作流：watch 模式 + 时间线 + locator picker 一体。

## 11. CI 与 sharding

```bash
# 分片（CI 并行）
npx playwright test --shard=1/4
npx playwright test --shard=2/4
```

```yaml
# .github/workflows/e2e.yml
jobs:
  test:
    strategy:
      matrix:
        shardIndex: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm exec playwright test --shard=${{ matrix.shardIndex }}/4
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: blob-report
          retention-days: 1
```

## 12. 与本仓库其他 skill 的衔接

- 单元/组件测试用 Vitest + RTL，见 [vitest-react](vitest-react.md)。
- Next.js E2E：`webServer.command: 'pnpm dev'`，测 App Router 路由见 [../nextjs/references/app-router.md](../nextjs/references/app-router.md)。
- 视觉回归/组件隔离开发用 Storybook，见 [storybook](storybook.md)。
- API mock 单元测试用 MSW，见 [../data-and-forms/references/msw.md](../data-and-forms/references/msw.md)。

## 13. 坑

| 坑 | 说明 |
|----|------|
| 用 `waitForSelector` + `click` | Locator 自带 auto-wait；直接 `getByRole(...).click()` |
| 普通断言测 DOM | `expect(value).toBe(...)` 不重试；DOM 断言用 `expect(locator).toBeVisible()` |
| `sleep` 等异步 | auto-wait + web-first 断言已覆盖；非要等用 `page.waitForTimeout`（最后手段） |
| `getByRole` 匹配多个报错 | 加 `{ name: '具体名' }` 收窄；或 `.first()` / `nth()` |
| `_react` / `_vue` selector 失效 | v1.58 移除；改 `getByRole` / `getByTestId` |
| 每个测试重复登录 | 用 `storageState` 复用，setup project 登录一次 |
| `test.only` 进了 CI | `forbidOnly: !!process.env.CI` 在 CI 强制失败 |
| trace 太大 | `trace: 'on-first-retry'`（非 `on`）；绿时不录 |
| flaky 测试 | 检查是否漏了 auto-wait；`retries` 兜底但治标不治本 |
| 浏览器没装 | `pnpm exec playwright install`；CI 加 `--with-deps` |
| 多 tab / iframe | `page.popup()` / `page.frameLocator()`；iframe 用 frameLocator 链式 |
| `toHaveText` 空格不匹配 | `toContainText` 更宽松；或正则 `/welcome/i` |
