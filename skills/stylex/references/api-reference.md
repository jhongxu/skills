# 其他 API 与类型

> 面向 `@stylexjs/stylex@0.19+`。核心 API（create/props/attrs/defineVars/createTheme/when）见 [styling.md](styling.md) / [theming.md](theming.md) / [recipes.md](recipes.md)。本篇收其余 API、类型与合并语义。

## 1. 合并语义：`styleResolution`

多个样式叠加时谁胜，由 babel-plugin 的 `styleResolution` 决定：

| 策略 | 行为 | 适用 |
|------|------|------|
| `property-specificity`（默认） | 更具体的属性胜出——`marginTop` 胜 `margin`，与 React Native 一致 | 多数项目，可预测 |
| `application-order` | `stylex.props` 里后写的胜出，与行内样式一致 | 需"后写覆盖"语义时 |

```json
{ "plugins": [["@stylexjs/babel-plugin", { "styleResolution": "property-specificity" }]] }
```

> 多数项目保持默认。切到 `application-order` 改变全局合并行为，需全队对齐。

`stylex.when.*` 的特异性排序（更具体者胜）：`ancestor` < `descendant` < `anySibling` < `siblingBefore` < `siblingAfter`。

## 2. `stylex.keyframes` — 动画

```tsx
const pulse = stylex.keyframes({
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.1)' },
  '100%': { transform: 'scale(1)' },
})

const styles = stylex.create({
  pulse: {
    animationName: pulse,
    animationDuration: '1s',
    animationIterationCount: 'infinite',
  },
})
```

- 必须在**使用的同文件**声明；重复声明在产物里去重。
- 链式多动画：逗号分隔 `animationName: \`${fadeIn}, ${expand}\``、`animationDuration: '1s, 1s'`。
- **跨文件复用**：用 `defineVars` 持有动画名（在 `.stylex.js` 导出），消费方像普通变量引用：

```ts
// animations.stylex.ts
const pulse = stylex.keyframes({ '0%': { opacity: 0 }, '100%': { opacity: 1 } })
export const animations = stylex.defineVars({ pulse })
```

## 3. `stylex.firstThatWorks` — 渐进增强

取第一个浏览器支持的值，生成带 `@supports` 的回退链：

```tsx
const styles = stylex.create({
  root: {
    position: stylex.firstThatWorks('sticky', 'fixed'),
    width: stylex.firstThatWorks('fit-content', 'max-content', '100%'),
  },
})
```

从左到右选第一个当前浏览器支持的；都不支持则用最后一个。适合新旧浏览器兼容场景。

## 4. `stylex.env.*` — 编译时常量（v0.18+）

值在 babel-plugin `env` 选项里定义，编译时替换为字面量：

```json
{ "env": { "mode": "production", "platform": "web" } }
```

```tsx
const styles = stylex.create({
  root: {
    padding: stylex.env.mode === 'production' ? 8 : 16,
  },
})
```

用于按构建目标生成不同样式（如 web vs react-native 共用代码）。常量集也可用 `stylex.defineConsts`（v0.17+）批量定义。

## 5. `stylex.defineConsts` — 编译时常量集（v0.17+）

```ts
export const consts = stylex.defineConsts({
  GRID: 8,
  MAX_WIDTH: 1200,
})
```

在 `.stylex.js` 导出，引用如普通变量；编译时内联。适合设计常量（栅格、断点）。

## 6. `@stylexjs/atoms` — 内联原子样式（v0.19）

无需 `create`，直接用原子助手表达常用样式，编译为同等的 `stylex.create` 输出：

```tsx
import _ from '@stylexjs/atoms'

<div {...stylex.props(_.display.flex, _.alignItems.center, _.color('blue'))} />
```

适合一次性、不复用的样式；与 `create` 产物同等去重。`_.display.flex`、`_.color(value)`、`_.padding(8)` 等覆盖常用属性。

## 7. `stylex.viewTransitionClass` — View Transition（v0.18+）

为 View Transition API 生成命名 class：

```tsx
const styles = stylex.create({
  card: {
    viewTransitionName: 'card',
  },
})
const vtClass = stylex.viewTransitionClass(styles.card)
// 配合 document.startViewTransition 切换时用
```

用于跨视图的平滑过渡（如列表→详情）。

## 8. `stylex.positionTry` — Anchor Positioning

为 CSS anchor positioning 生成 `position-try` 回退链：

```tsx
const styles = stylex.create({
  popover: {
    positionAnchor: '--anchor',
    positionArea: 'inline-end center',
    positionTryFallbacks: stylex.positionTry('flip-inline', 'flip-block'),
  },
})
```

用于 popover/tooltip 的智能定位回退（实验性 CSS 特性，注意浏览器支持）。

## 9. 类型

| 类型 | 作用 |
|------|------|
| `StyleXStyles` | `create` / `createTheme` 返回的样式对象类型；可作 prop 传递、合并 |
| `StaticStyles` | 仅静态值的样式子集（不含动态函数值） |
| `StyleXStylesWithout<T, K>` | 从 `T` 去掉 `K` 属性的样式类型，用于精确 override 约束 |
| `VarGroup<T>` | `defineVars` 返回类型，`T` 记录每变量的类型；`createTheme` override 由它推导 |
| `Theme<T>` | `createTheme` 返回类型 |

常用：组件 `style?: StyleXStyles` prop；变体集合 `keyof typeof variants`。`StyleXStylesWithout` 用于"只允许覆盖部分属性"的 API 设计。

## 10. 速查

| 需求 | API |
|------|-----|
| 合并策略 | `styleResolution`（babel-plugin） |
| 动画 | `stylex.keyframes`（同文件声明；跨文件用 `defineVars`） |
| 渐进增强 | `stylex.firstThatWorks(...)` |
| 编译时常量 | `stylex.env.*`（配 `env` 选项）/ `stylex.defineConsts` |
| 内联原子（v0.19） | `@stylexjs/atoms`：`_.display.flex` |
| View Transition | `stylex.viewTransitionClass` |
| Anchor 定位回退 | `stylex.positionTry` |
| 样式对象类型 | `StyleXStyles` |
| 变量组类型 | `VarGroup<T>` |
| 主题类型 | `Theme<T>` |
| 部分覆盖约束 | `StyleXStylesWithout<T, K>` |
