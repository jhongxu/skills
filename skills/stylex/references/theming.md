# 主题系统

> 面向 `@stylexjs/stylex@0.19+`。前提：babel-plugin 已启用 `unstable_moduleResolution`（见 [installation.md](installation.md) 第 3 节）。样式基础见 [styling.md](styling.md)。

StyleX 的主题基于 CSS 变量：`defineVars` 声明 token（编译成 CSS 变量），`createTheme` 生成覆盖这些变量的样式对象。类型安全，端到端 TS 推断。

## 1. `stylex.defineVars` — 定义变量

只能在 `.stylex.js` / `.stylex.ts` 文件里**命名导出**（编译器靠文件名识别）：

```ts
// tokens.stylex.ts
import * as stylex from '@stylexjs/stylex'

export const colors = stylex.defineVars({
  accent: 'blue',
  surface: 'white',
  '--bg': 'black',   // '--' 前缀 → 用自定义 CSS 变量名（非哈希）
})
```

- 每个键编译成一个 CSS 变量；默认 `--x-hash-accent`，加 `--` 前缀则用你给的名（如 `--bg`）。
- 值可为字符串，或带状态的命名空间对象（`{ default, '@media ...': ... }`）。
- 在任意 `stylex.create` 里引用：

```tsx
import { colors } from './tokens.stylex'
const styles = stylex.create({
  root: { color: colors.accent, backgroundColor: colors['--bg'] },
})
```

## 2. `stylex.createTheme` — 创建主题（覆盖变量）

```tsx
import * as stylex from '@stylexjs/stylex'
import { colors } from './tokens.stylex'

const darkTheme = stylex.createTheme(colors, {
  accent: 'red',
  surface: 'black',
  '--bg': 'white',
})
```

- 第一个参数是要覆盖的变量组（`defineVars` 的返回），第二个是 override。
- **未覆盖的变量回退到 `defineVars` 的默认值**。
- override 必须与 `defineVars` 的键匹配，TS 会校验。
- 与 `defineVars` 不同：`createTheme` **可在任意文件**、可跨文件/组件传递。
- 同一 HTML 元素上应用多个同变量组的 theme：**最后应用者胜**。

## 3. 应用主题

theme 是 `StyleXStyles`，用 `stylex.props` 应用到元素根，覆盖该元素及所有后代的变量：

```tsx
import { dracula } from '../themes'

const styles = stylex.create({
  container: {
    color: colors.primaryText,
    backgroundColor: colors.background,
  },
})

function MyComponent() {
  return <div {...stylex.props(dracula, styles.container)}>{children}</div>
}
```

子树里所有引用这些变量的样式自动切换到新值。

## 4. Light / Dark 主题

### 传统：三套 `createTheme`

```ts
export const light = stylex.createTheme(vars, { primaryColor: 'black', /* ... */ })
export const dark  = stylex.createTheme(vars, { primaryColor: 'white', /* ... */ })
export const system = stylex.createTheme(vars, {
  primaryColor: {
    default: 'black',
    '@media (prefers-color-scheme: dark)': 'white',
  },
})
```

按状态在根组件切换 `stylex.props(light)` / `stylex.props(dark)`。所有支持 CSS 变量的浏览器都可用。

### 现代：`light-dark()` CSS 函数（推荐）

```ts
export const vars = stylex.defineVars({
  primaryColor: 'light-dark(black, white)',
  // ...
})
```

用 `color-scheme` CSS 属性控制实际取值：

```tsx
const styles = stylex.create({
  light: { colorScheme: 'light' },
  dark: { colorScheme: 'dark' },
  system: { colorScheme: 'light dark' },
})

<div {...stylex.props(styles[colorScheme])}>...</div>
```

- 无需定义多套主题，代码更简。
- **限制**：`light-dark()` 仅用于颜色值；老浏览器不支持。
- 可与自定义 `createTheme` 共存（在 theme override 里也能用 `light-dark()`）。

## 5. 合并主题（Merge Themes）

多个 theme 可在 `stylex.props` 里叠加，后者覆盖前者同键：

```tsx
<div {...stylex.props(baseTheme, brandOverrides, styles.container)}>
```

用途：基础主题 + 品牌定制 + 组件局部覆盖分层叠加。同变量组的多个 theme 叠加时，**最后应用者胜**；不同变量组互不干扰。

## 6. 重置主题（Reset Themes）

要恢复某子树到 `defineVars` 的默认值，应用一个**全键覆盖回默认值**的 theme，或用一个"空"theme 把变量显式重置。常用于"退出品牌定制回到默认"的局部区域。配合合并主题可在子树局部重置再覆盖。

## 7. 可分享 token（Shareable Tokens）

`defineVars` 的导出是纯数据（CSS 变量引用），可发布到 npm。消费方：
- 用 `stylex.create` 引用这些变量（自动获得类型）。
- 用 `createTheme` 覆盖（需 `importSources`/`aliases` 配置，让编译器跨包解析 `.stylex.js`）。

这让设计系统的 token 层与组件层解耦：token 包发布变量，组件包引用，应用层用 `createTheme` 定制。

## 8. 变量类型（Variable Types）

`defineVars` 的返回类型是 `VarGroup<T>`，T 记录每个变量的类型。`createTheme` 的 override 参数由 `VarGroup` 推导，键必须匹配、值类型兼容。这让主题 override 全链路类型安全——改 token 定义，所有 theme 的 TS 报错即时定位。类型细节见 [api-reference.md](api-reference.md)。

## 9. 速查

| 需求 | API |
|------|-----|
| 定义 token | `stylex.defineVars`（`.stylex.js` 命名导出） |
| 自定义变量名 | 键加 `--` 前缀 |
| 覆盖 token | `stylex.createTheme(vars, overrides)`（任意文件） |
| 应用主题 | `stylex.props(theme, styles.x)` 到元素根 |
| Light/Dark（现代） | `light-dark()` + `colorScheme` |
| Light/Dark（传统） | 三套 `createTheme`（含 `@media (prefers-color-scheme)`） |
| 分层定制 | 多 theme 叠加（最后胜） |
| 跨包分享 token | 发布 `defineVars` + 配 `importSources`/`aliases` |
| 前置配置 | babel-plugin `unstable_moduleResolution` |
