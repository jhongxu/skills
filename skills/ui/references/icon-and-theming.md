# Icon & Theming

> 面向 `antd@6.5` + `@ant-design/icons@6`。图标用 @ant-design/icons；主题由 `ConfigProvider` 的 `theme` 驱动，基于三层 Design Token（Seed → Map → Alias）+ algorithm 推导。v6 默认开 CSS 变量，并提供 `zeroRuntime` 去运行时样式。

## 1. Icons（@ant-design/icons@6）

### 安装与基本用法

```bash
pnpm add @ant-design/icons@6   # 必须与 antd@6 配套
```

```tsx
import { HomeOutlined, UserOutlined } from '@ant-design/icons'

export function Nav() {
  return (
    <nav>
      <HomeOutlined /> 首页
      <UserOutlined style={{ color: '#1677ff' }} /> 用户
    </nav>
  )
}
```

三种风格：`*Outlined`（线性）、`*Filled`（填充）、`*TwoTone`（双色，主色跟随 `colorPrimary`）。

```tsx
import { StarOutlined, StarFilled, StarTwoTone } from '@ant-design/icons'
;<StarOutlined />
;<StarFilled />
;<StarTwoTone twoToneColor="#eb2f96" />
```

### 图标属性

```tsx
<HomeOutlined
  style={{ fontSize: 16, color: '#1677ff' }}
  spin            // 旋转动画
  rotate={180}    // 旋转角度
  rotateSpeed={2} // 旋转速度（秒）
/>
```

### 自定义 SVG 图标

```tsx
import { createFromIconfontCN } from '@ant-design/icons'

// iconfont 字体图标
const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/c/font_xxx.js',
})

export function MyIcon() {
  return <IconFont type="icon-custom" />
}
```

```tsx
// 直接用 SVG
import Icon from '@ant-design/icons'
import type { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon'

const Svg = () => (
  <svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024">
    <path d="M..." />
  </svg>
)

export const MyLogo = (props: Partial<CustomIconComponentProps>) => (
  <Icon component={Svg} {...props} />
)
```

> 第三方图标库（如 lucide-react）的 `<svg>` 在 v6 里与 antd 组件（Tag/Button/Tabs）混用时，已自动垂直对齐——6.5.x 修了第三方 svg 的对齐与基础样式问题。

## 2. Theming 基础

`ConfigProvider` 的 `theme` 是主题入口：

```tsx
import { ConfigProvider, theme } from 'antd'

export default function Root() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',   // Seed Token：改一个，连带派生
          borderRadius: 8,
        },
      }}
    >
      <App />
    </ConfigProvider>
  )
}
```

### 三层 Design Token

| 层 | 说明 | 改法 |
|----|------|------|
| **Seed Token** | 主题意图的源头（如 `colorPrimary`、`borderRadius`） | `theme.token.colorPrimary` |
| **Map Token** | 从 Seed 派生的渐变变量（如 `colorPrimaryBg`） | `theme.token.colorPrimaryBg`（覆盖单值）或 `algorithm`（保派生关系） |
| **Alias Token** | 控制通用组件样式批量（Map 的别名/特殊处理） | `theme.token.*` |

```tsx
// Seed：改主色，antd 自动算出 Bg/Hover/Border 等系列色
theme={{ token: { colorPrimary: '#00b96b' } }}

// Map：单独覆盖某个派生值（不破坏其他派生）
theme={{ token: { colorPrimaryBg: '#e6f7ff' } }}
```

## 3. Algorithm（预设主题算法）

三套预设算法，可组合：

```tsx
import { theme } from 'antd'

<ConfigProvider
  theme={{
    algorithm: theme.darkAlgorithm,    // defaultAlgorithm | darkAlgorithm | compactAlgorithm
    // algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],  // 组合
  }}
>
  <App />
</ConfigProvider>
```

- `theme.defaultAlgorithm`：默认浅色
- `theme.darkAlgorithm`：暗色
- `theme.compactAlgorithm`：紧凑（间距更小）

## 4. 暗色模式

```tsx
import { ConfigProvider, theme } from 'antd'

export function Root({ dark }: { dark: boolean }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: dark ? { colorPrimary: '#1668dc' } : { colorPrimary: '#1677ff' },
      }}
    >
      <App />
    </ConfigProvider>
  )
}
```

> 暗色切换是即时的：改 `algorithm` 即可，无需重载。配合 CSS 变量模式（默认开）性能更好。

## 5. 组件级 Token

每个组件有自己的 Component Token，只影响该组件：

```tsx
<ConfigProvider
  theme={{
    components: {
      Button: {
        borderRadius: 4,
        controlHeight: 40,
        // 6.x 组件 token 可开 algorithm 派生（>=5.8.0 起）
        algorithm: true,
      },
      Input: {
        colorBgContainer: '#f5f5f5',
      },
    },
  }}
>
  <App />
</ConfigProvider>
```

## 6. 消费 Token：`useToken` / `getDesignToken`

```tsx
import { theme } from 'antd'

const { useToken, getDesignToken } = theme

// React 内消费
function MyComponent() {
  const { token } = useToken()
  return (
    <div style={{ background: token.colorPrimary, padding: token.paddingMD }}>
      <span style={{ color: token.colorTextLightSolid }}>标题</span>
    </div>
  )
}

// React 外（如生成 less 变量、构建期预渲染）
const globalToken = getDesignToken({ token: { colorPrimary: '#1677ff' } })
// globalToken.colorPrimaryBg, globalToken.borderRadius, ...
```

`useToken` 让自定义组件与 antd 主题保持一致——这是中后台做自定义样式时首选方式，比硬编码颜色值强。

## 7. 嵌套主题（局部主题）

```tsx
<ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
  <App />
  <ConfigProvider theme={{ token: { colorPrimary: '#00b96b' } }}>
    {/* 这块用绿色主题，其余 token 继承父级 */}
    <Sidebar />
  </ConfigProvider>
</ConfigProvider>
```

子主题未改的 token 自动继承父主题。

## 8. CSS Variables（v6 默认开）

v6 默认 `cssVar: true`，把 token 生成 CSS 变量挂到 `:root`（或 `prefix-cls` scope），主题切换不再重算所有样式：

```tsx
<ConfigProvider
  theme={{
    cssVar: true,           // 默认开
    hashed: false,          // 配合 cssVar，去掉 className hash，产物更干净
    key: 'app',             // 多主题共存时给个 key 隔离
  }}
>
  <App />
</ConfigProvider>
```

CSS 变量模式下，你可以在自己的 CSS 里直接用 antd 的变量：

```css
.my-section {
  background: var(--ant-color-primary-bg);
  color: var(--ant-color-text);
  border-radius: var(--ant-border-radius);
}
```

## 9. `zeroRuntime`（v6 新增，构建期样式）

去掉运行时样式生成，提升性能。代价是要手动引入静态 CSS：

```tsx
// 入口处引入静态样式（含全部组件样式，无 hash）
import 'antd/dist/antd.css'

export default () => (
  <ConfigProvider theme={{ zeroRuntime: true }}>
    <App />
  </ConfigProvider>
)
```

只想要部分组件样式，或改了 `prefix` 导致默认静态样式用不了，用 `@ant-design/static-style-extract` 提取：

```tsx
import fs from 'fs'
import { extractStyle } from '@ant-design/static-style-extract'

const cssText = extractStyle({
  includes: ['Button'],   // 只要 Button
})
fs.writeFileSync('./antd-button.css', cssText)
```

> `zeroRuntime` 适合对首屏性能极度敏感的场景。普通项目用默认 cssVar 已经够快。

## 10. 关闭动效

某些场景动效影响性能或可访问性，关掉：

```tsx
<ConfigProvider theme={{ token: { motion: false } }}>
  <App />
</ConfigProvider>
```

## 11. prefix / csp / locale

```tsx
import zhCN from 'antd/locale/zh_CN'

<ConfigProvider
  prefix="my"        // class 前缀，避免与另一个 antd 实例冲突
  csp={{ nonce: 'xxx' }}   // CSP 环境下给内联 style 加 nonce
  locale={zhCN}      // 国际化（日期、文案）
  theme={...}
>
  <App />
</ConfigProvider>
```

## 12. 主题调试

官方 [Theme Editor](https://ant.design/theme-editor) 可视化调 token，导出配置直接贴进 `theme`。

## 13. 与本仓库其他 skill 的衔接

- antd 组件 API 见 [antd-v6](antd-v6.md)。
- 工具类 [../../foundation/references/unocss.md](../../foundation/references/unocss.md)：在 CSS 里用 `var(--ant-color-primary)` 与 antd token 联动；共存用 CSS layers。
- Server Components 场景见 [../../react/references/server-components.md](../../react/references/server-components.md)：ConfigProvider 在 client boundary 包裹。
- 表单见 [../../tanstack/references/form.md](../../tanstack/references/form.md)（进阶）或 [antd-v6](antd-v6.md) 的 Form。

## 14. 坑

| 坑 | 说明 |
|----|------|
| `message`/`Modal`/`notification` 静态方法没主题 | 它们丢 context；用 `App.useApp()`（见 [antd-v6](antd-v6.md)） |
| `useToken` 拿到旧值 | 在 `ConfigProvider` 子树里调用才有效；根组件外层拿不到 |
| 暗色切换闪烁 | 确保开了 `cssVar`（默认开）；关 `hashed` 让变量稳定 |
| `colorPrimaryBg` 改了不联动 | 直接覆盖 Map Token 会破坏派生；要联动改 Seed 或用 `algorithm` |
| `zeroRuntime` 组件没样式 | 入口必须 `import 'antd/dist/antd.css'`；改了 `prefix` 要用 static-style-extract |
| `cssVar` 与组件库冲突 | 多套 CSS 变量并存时给 `theme.key` 隔离 scope |
| `prefix` 改了样式失效 | `zeroRuntime` 下默认静态 CSS 不含新 prefix，需重新 extract |
| 自定义 SVG 颜色不变 | 用 `fill="currentColor"` 跟随父级 color |
| 第三方 svg 与 antd 文字不对齐 | 升到 6.5+，已自动垂直对齐 |
