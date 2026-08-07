# 定义与应用样式

> 面向 `@stylexjs/stylex@0.19+`。安装与配置见 [installation.md](installation.md)；变体等实战模式见 [recipes.md](recipes.md)；其他 API 见 [api-reference.md](api-reference.md)。

## 1. `stylex.create` — 定义样式

```tsx
import * as stylex from '@stylexjs/stylex'

const styles = stylex.create({
  root: {
    width: '100%',
    maxWidth: 800,            // 数字自动转 px
    minHeight: 40,
    paddingInlineStart: '2rem',
  },
  active: {
    backgroundColor: 'blue',
  },
  // 动态样式：函数值，运行时求值，进 style 属性（不进原子 class）
  dynamic: (opacity: number) => ({ opacity }),
})
```

要点：
- **数字当 px**（`maxWidth: 800` → `800px`）；非 px 单位用字符串。
- **静态值**（字符串/数字）编译成原子 class，参与全局去重。
- **函数值**（动态）运行时求值，输出到元素的 `style` 属性，**不进原子 class、不去重**——高频动态样式优先考虑 CSS 变量（见 [theming.md](theming.md)）。
- `create` 的返回是 `StyleXStyles` 对象，**不可在运行时读/改**其内部结构。

## 2. `stylex.props` — 应用样式

```tsx
function Button({ active, style, opacity }: Props) {
  return (
    <button
      {...stylex.props(
        styles.root,                    // 基础
        active && styles.active,        // 条件：false/null/undefined 被跳过
        style,                          // 外部传入的样式对象
        styles.dynamic(opacity),        // 动态
      )}
    >
      保存
    </button>
  )
}
```

`stylex.props(...styles)` 返回 `{ className, style }`，展开到元素。参数可为任意数量，含 `null`/`false`/`undefined`（被跳过）。

合并语义由 `styleResolution` 决定（见 [api-reference.md](api-reference.md)）：默认 `property-specificity` 下，`marginTop` 胜 `margin`，与 React Native 一致，可预测。

## 3. `sx` 简写（v0.18.1+）

```tsx
<button sx={styles.root}>保存</button>
// 编译等价于：
<button {...stylex.props(styles.root)}>保存</button>
```

- 仅对**小写 DOM 元素**（`div`/`button`/`span`…）生效；自定义组件仍需显式 `stylex.props`。
- 可用 babel `sxPropName` 改名（如 `css`）或 `false` 禁用。
- 可与 `style`/其他 props 共存。

## 4. `stylex.attrs` — 非 React 框架

Solid / Svelte / Qwik / Vue 用 `attrs`，返回 `class` + 字符串 `style`：

```tsx
<div {...stylex.attrs(styles.root, cond && styles.active)} />
```

与 `props` 的差别：`props` 返回 React 风格 `className` + `style` 对象；`attrs` 返回 `class` + 字符串 `style`，适配非 React 的属性约定。

## 5. 伪类、伪元素、媒体查询

直接作为声明对象的键：

```tsx
const styles = stylex.create({
  button: {
    backgroundColor: 'blue',
    ':hover': { backgroundColor: 'darkblue' },
    ':focus-visible': { outline: '2px solid blue' },
    '::before': { content: '"•"' },
    '@media (max-width: 600px)': { padding: 4 },
  },
})
```

也支持命名空间写法（同一属性多状态）：

```tsx
const styles = stylex.create({
  button: {
    backgroundColor: {
      default: 'blue',           // 无状态默认
      ':hover': 'darkblue',
      ':focus-visible': 'royalblue',
    },
  },
})
```

### 基于祖先/兄弟状态：`stylex.when.*`

伪类只能描述元素自身状态。要基于**祖先 hover、兄弟存在**等驱动样式，用 `stylex.when`（见 [recipes.md](recipes.md) 的 descendant-styles）：

```tsx
const styles = stylex.create({
  card: {
    transform: {
      default: 'translateX(0)',
      [stylex.when.ancestor(':hover')]: 'translateX(10px)',
    },
  },
})

<div {...stylex.props(stylex.defaultMarker())}>
  <div {...stylex.props(styles.card)}>hover 父级让我位移</div>
</div>
```

`when` 依赖 `:has()`，注意浏览器支持；多套独立上下文用 `stylex.defineMarker()` 区分。

## 6. 全局样式

`stylex.create` 生成的是带 class 的局部样式。需要全局重置/基础样式时，用 `stylex.defineGlobals`（在 `.stylex.js` 文件）：

```ts
// globals.stylex.ts
import * as stylex from '@stylexjs/stylex'

export const globals = stylex.defineGlobals({
  '*': { boxSizing: 'border-box' },
  'html, body': { margin: 0, padding: 0 },
})
```

在根组件 `{...stylex.props(globals)}` 应用一次。

## 7. 限制与坑

| 坑 | 说明 |
|----|------|
| 动态值不进原子 class | 函数值进 `style` 属性，失去去重；高频动态用 CSS 变量 |
| `create` 返回不可运行时读 | 不要 `Object.keys(styles)` 遍历其内部；只能整体传给 `props` |
| 数字仅 px | `padding: 4` → `4px`；`%`/`rem`/`em` 必须字符串 |
| `sx` 仅 DOM 元素 | 自定义组件要用 `stylex.props` |
| 简写展开 | `valid-shorthands` 把 `margin` 展开为 `marginBlock/Inline`；与 `legacy-expand-shorthands` 行为不同，团队对齐 |
| 伪类键名精确 | `:hover` 而非 `hover`；`@media (min-width: 600px)` 而非 `@media(min-width:600px)` |

## 8. 速查

| 需求 | API |
|------|-----|
| 定义静态样式 | `stylex.create({ key: {...} })` |
| 定义动态样式 | `stylex.create({ key: (x) => ({...}) })` |
| 应用到 React 元素 | `stylex.props(...)` 或 `sx={}` |
| 应用到非 React 元素 | `stylex.attrs(...)` |
| 伪类/媒体查询 | 声明对象键 `':hover': {}` / `'@media ...': {}` |
| 祖先/兄弟状态 | `stylex.when.*` + `stylex.defaultMarker()` |
| 全局重置 | `stylex.defineGlobals`（`.stylex.js`） |
| 条件样式 | `cond && styles.x`（false 被跳过） |
