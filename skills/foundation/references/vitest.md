# Vitest

> 面向 `vitest@3`（v3.2 起 `workspace` 配置更名为 `projects`）。Vite 驱动的测试框架，与 Vite/React 项目共享配置。Jest 兼容 API + 原生 ESM + 浏览器模式 + 类型测试。

为什么用它：和 Vite 项目共享 transformer/resolver/plugin（测试与生产同构）、watch 模式像 HMR 一样快、原生 ESM 和 top-level await、浏览器模式跑真实浏览器测试、`expect-type` 做类型回归测试。

## 1. 安装与最小配置

```bash
pnpm add -D vitest
# DOM 测试还要环境
pnpm add -D jsdom        # 或 happy-dom（更快，但兼容性弱些）
```

```jsonc
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui"
  }
}
```

最小 `vitest.config.ts`（和 vite 配置分开，避免污染 build）：

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,          // 直接用 describe/it/expect，不 import
    setupFiles: ['./test/setup.ts'],
  },
})
```

> 已有 `vite.config.ts`？Vitest 会自动读它。但建议单独建 `vitest.config.ts`，因为 `vite.config.ts` 里的 `build`/`server` 选项对测试无意义且可能拖慢。也可用 `vitest.config.ts` 里 `mergeConfig` 合并 vite 配置。

## 2. 运行模式

```bash
vitest               # watch 模式（开发默认）
vitest run           # 单次跑（CI 默认，process.env.CI 存在时自动 run）
vitest run --reporter=verbose
vitest -t "renders"  # 只跑名字匹配的测试
vitest --standalone  # 后台常驻，只跑变更的测试
vitest --no-isolate  # 关文件隔离（换性能，慎用）
vitest --project unit --project e2e   # 只跑指定 project
```

## 3. 测试 API 速查

```ts
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'

describe('Component', () => {
  it('renders', async () => {
    // it 默认串行；并发用 it.concurrent
    expect(1 + 1).toBe(2)
    expect({ a: 1 }).toMatchObject({ a: 1 })
    expect(fn).toThrow(/error/)
    await expect(fetch('/api')).resolves.toBeTruthy()
  })

  it.concurrent('parallel test 1', async ({ expect }) => { /* */ })
  it.concurrent('parallel test 2', async ({ expect }) => { /* */ })

  it.skip('skipped', () => {})
  it.todo('not written')
  it.only('only this', () => {})
})
```

> 并发测试里 snapshot 和 assertion 必须用 **测试上下文** 里的 `expect`（参数），不能用全局的，否则找错当前测试。

### 测试上下文

```ts
it('with context', ({ task, expect, vi, onTestFinished }) => {
  onTestFinished(() => { /* 测试结束清理，即使失败也跑 */ })
})
```

## 4. Mock

```ts
import { vi } from 'vitest'

// 整个模块 mock
vi.mock('@/api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'tanner' }),
}))

// spy
const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
spy.mockRestore()

// 假时间
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
it('advances', () => {
  vi.advanceTimersByTime(1000)
})
```

配置层控制 mock 行为：

```ts
// vitest.config.ts
test: {
  clearMocks: true,      // 每个测试前 clear mock.calls（不重置实现）
  mockReset: false,      // true = reset 实现（v3 行为改了，默认只 reset 调用记录）
  restoreMocks: true,    // 恢复 spy 到原实现
  unstubGlobals: true,   // 恢复 vi.stubGlobal 的全局
  unstubEnvs: true,      // 恢复 vi.stubEnv
}
```

## 5. 环境（DOM）

```ts
test: {
  environment: 'jsdom',     // 'node'（默认）| 'jsdom' | 'happy-dom' | 'edge-runtime'
  environmentOptions: {
    jsdom: { /* jsdom 选项 */ },
  },
}
```

按文件覆盖：

```ts
// @vitest-environment happy-dom
import { test } from 'vitest'
```

## 6. Projects（monorepo，3.2+ 取代 workspace）

一个 Vitest 进程跑多套配置。monorepo 里每个子包一个 project，或同包内 unit/e2e 分开：

```ts
// 根 vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['packages/*'],          // 每个子包当 project
    // projects: [
    //   'packages/*',
    //   '!packages/excluded',          // 排除
    //   {
    //     extends: true,               // 继承根配置（plugins/pool 等）
    //     test: {
    //       name: 'browser',
    //       include: ['**/*.browser.test.ts'],
    //       environment: 'jsdom',
    //     },
    //   },
    // ],
  },
})
```

子包配置用 `defineProject`（比 `defineConfig` 类型更严，会拒绝 project 不支持的选项如 `reporters`/`coverage`）：

```ts
// packages/ui/vitest.config.ts
import { defineProject } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineProject({
  plugins: [react()],
  test: {
    name: 'ui',          // 必须唯一
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
```

project 配置文件命名规则（glob 命中文件时校验）：`vitest.config.*` / `vite.config.*` 或 `vitest.<name>.config.*` / `vite.<name>.config.*`。

> `workspace` 配置项 3.2 起废弃改名 `projects`，功能相同。

## 7. 浏览器模式（真实浏览器）

jsdom/happy-dom 是模拟环境，会有与真实浏览器不一致的边界情况。浏览器模式在真浏览器跑，更可信但更慢。

```bash
pnpm add -D vitest @vitest/browser-playwright playwright
# 或 @vitest/browser-preview（本地预览，用模拟事件，不支持 CI）
# 或 @vitest/browser webdriverio
```

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [react()],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),      // provider 是函数调用，不是字符串
      instances: [
        { browser: 'chromium' },
        // { browser: 'firefox' },
        // { browser: 'webkit' },
      ],
      headless: true,             // CI 用
    },
  },
})
```

浏览器 locators API（类 Playwright）：

```ts
import { test, expect } from 'vitest'
import { page } from '@vitest/browser/context'

test('renders button', async () => {
  // 假设你 render 了一个组件到 document.body
  const button = page.getByRole('button', { name: 'Submit' })
  await button.click()
  await expect(page.getByText('Submitted')).toBeVisible()
})
```

默认端口 `63315`（避开 dev server），用 `browser.api` 改。

> 浏览器模式仍在早期，建议补 Playwright/Cypress 做完整 E2E。

## 8. 类型测试（type testing）

用 `expect-type` 写类型回归测试，文件名 `.test-d.ts`：

```ts
// types.test-d.ts
import { assertType, expectTypeOf, test } from 'vitest'
import { createUser } from './user'

test('createUser returns User', () => {
  const user = createUser({ name: 'a' })
  assertType<{ id: string; name: string }>(user)
  expectTypeOf(user.id).toEqualTypeOf<string>()
  expectTypeOf(user).not.toMatchTypeOf<{ name: number }>()
})
```

配置：

```ts
test: {
  typecheck: {
    enabled: true,                // 跑 vitest typecheck
    include: ['**/*.test-d.ts'],
    exclude: ['node_modules/**'],
  },
}
```

`vitest typecheck` 跑 tsc 验证类型测试。`expect-type`/`assertType` 只在类型层工作，运行时是空操作。

## 9. 并发与 pool

```ts
test: {
  pool: 'threads',     // 'threads'（worker_threads）| 'forks'（child_process，默认）| 'vmThreads' | 'vmForks'
  poolOptions: {
    threads: {
      maxThreads: 4,
      minThreads: 1,
      isolate: true,    // 每个文件独立环境（默认）
    },
  },
  fileParallelism: true,
  maxWorkers: '50%',    // 或数字
  maxConcurrency: 5,    // 单文件内并发数
}
```

`forks`（默认）用 `node:child_process`，兼容性最好；`threads` 用 `worker_threads` 更快但某些包不兼容。`isolate: false` 关文件隔离能提速但会让测试互相污染。

## 10. 快照

```ts
import { expect, it } from 'vitest'

it('snapshot', () => {
  expect(render()).toMatchSnapshot()
  expect({ a: 1 }).toMatchInlineSnapshot(`
    { "a": 1 }
  `)
})

// 属性快照
expect(user).toMatchInlineSnapshot({ id: expect.any(String) })
```

更新：`vitest -u`。配置 `snapshotFormat` 控制序列化（如 `printBasicPrototype: false`）。

## 11. coverage

```ts
test: {
  coverage: {
    enabled: true,
    provider: 'v8',         // 'v8'（默认）| 'istanbul'
    reporter: ['text', 'json', 'html', 'lcov'],
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['src/**/*.test.*', 'src/**/types.ts'],
    thresholds: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
}
```

## 12. CLI 常用

```bash
vitest run                    # 单次
vitest --coverage             # 带覆盖率
vitest --ui                   # 浏览览器 UI
vitest --reporter=json        # CI 输出
vitest --reporter=junit --outputFile=test-results.xml
vitest --shard 1/4            # 分片（CI 并行）
vitest --retry 2              # 失败重试
vitest --bail                 # 失败 N 次后停
vitest --changed              # 只跑受改动影响的测试
vitest --project unit         # 只跑指定 project
```

## 13. setup 文件

```ts
// test/setup.ts
import '@testing-library/jest-dom/vitest'   // jest-dom matchers
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())      // 每个测试后卸载组件
```

```ts
test: { setupFiles: ['./test/setup.ts'] }
```

## 14. 与本仓库其他 skill 的衔接

- 用 [pnpm](pnpm.md) 装；monorepo 用 `projects` 配置，每个子包 `defineProject`。
- 库用 [tsdown](tsdown.md) 打包；`tsdown` 的 `fromVite: 'vitest'` 可复用 vitest 配置。
- 测 React 组件见 [react](../react/SKILL.md) skill 的测试章节。
- 测 TanStack Query/Form 见 [tanstack](../tanstack/SKILL.md) 的 query.md / form.md。
- 代码风格用 [eslint-antfu](eslint-antfu.md)；它内置 `test/*` 规则（vitest 插件）。

## 15. 坑

| 坑 | 说明 |
|----|------|
| `workspace` 配置不生效 | 3.2 改名 `projects`；旧名仍能用但会 deprecated |
| project 里写 `reporters` 报错 | project 不支持 `reporters`/`coverage`/`resolveSnapshotPath`，只能放根配置 |
| `vi.mock` 提升不生效 | `vi.mock` 必须在文件顶层，工厂函数里引用的变量用 `vi.hoisted` 包裹 |
| 并发测试 snapshot 错位 | 用测试上下文的 `expect`（参数），别用全局 |
| jsdom 缺 API（如 `IntersectionObserver`） | 在 setup 里 polyfill：`globalThis.IntersectionObserver = class { ... }` |
| watch 模式跑太多 | `--changed` 只跑受影响测试；`--standalone` 常驻 |
| happy-dom 与 jsdom 行为不同 | 关键 DOM 测试优先 jsdom 或直接用浏览器模式 |
| ESM 包在 CJS 测试里报错 | `test.server.deps.inline` 加包名强制走 ESM 转换 |
| fake timers 与 Promise 顺序 | `vi.advanceTimersByTimeAsync()` 替代同步版本，让微任务也推进 |
