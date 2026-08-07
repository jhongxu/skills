# 实战模式

> 面向 `@stylexjs/stylex@0.19+`。基础 API 见 [styling.md](styling.md)；主题见 [theming.md](theming.md)。

## 1. 核心理念：样式是一等对象

StyleX 的设计前提是**样式是普通的 JS 对象**，可像数据一样传递、组合、条件化。这带来：
- 组件自带默认样式，消费者可覆盖（`stylex.props(styles.default, props.style)`）。
- 样式作 prop 传递（`<Card style={styles.card} />`），消费方再叠加。
- 变体、上下文驱动样式都用普通 JS 模式实现，无需专用 DSL。

## 2. Variants — 变体模式

StyleX 没有专用 variants API，用多个 `stylex.create` 分组 + `keyof typeof` 推导类型：

```tsx
import * as stylex from '@stylexjs/stylex'

const styles = stylex.create({
  base: { appearance: 'none', borderWidth: 0 },
})

const colorVariants = stylex.create({
  primary:   { backgroundColor: { default: 'blue',  ':hover': 'darkblue'  }, color: 'white' },
  secondary: { backgroundColor: { default: 'gray',  ':hover': 'darkgray'  }, color: 'white' },
})

const sizeVariants = stylex.create({
  small:  { fontSize: '1rem',   paddingBlock: 4, paddingInline: 8  },
  medium: { fontSize: '1.2rem', paddingBlock: 8, paddingInline: 16 },
})

type Props = {
  color?: keyof typeof colorVariants
  size?: keyof typeof sizeVariants
  style?: stylex.StyleXStyles
}

function Button({ color = 'primary', size = 'small', style, ...props }: Props) {
  return (
    <button
      {...props}
      {...stylex.props(
        styles.base,
        colorVariants[color],
        sizeVariants[size],
        style,
      )}
    />
  )
}

<Button color="primary" size="medium">Primary</Button>
<Button color="secondary">Secondary</Button>
```

`keyof typeof colorVariants` 自动得到 `'primary' | 'secondary'`，新增变体只需加一个键，类型同步。

## 3. Compound Variants — 组合变体

变体依赖多个 prop 组合时，两种做法：

### 简单情况：依赖确定性合并

StyleX 的合并是确定性的（`property-specificity` 下具体属性胜出）。多数"组合"场景直接把条件样式作为独立项加入 `props` 即可：

```tsx
{...stylex.props(
  styles.base,
  colorVariants[color],
  sizeVariants[size],
  disabled && styles.disabled,   // disabled 覆盖前面同属性的 backgroundColor/color
  style,
)}
```

### 复杂情况：多套变体集合

需要显式区分时，按条件切换变体集合：

```tsx
const colorVariantsEnabled = stylex.create({
  primary:   { backgroundColor: { default: 'blue', ':hover': 'darkblue' }, color: 'white' },
  secondary: { backgroundColor: { default: 'gray', ':hover': 'darkgray' }, color: 'white' },
})

const colorVariantsDisabled = stylex.create({
  primary:   { backgroundColor: 'blue', color: 'rgb(204,204,204)' },
  secondary: { backgroundColor: 'gray', color: 'rgb(204,204,204)' },
})

function Button({ color = 'primary', disabled = false }) {
  const colorVariants = disabled ? colorVariantsDisabled : colorVariantsEnabled
  return <button {...stylex.props(styles.base, colorVariants[color], sizeVariants[size])} />
}
```

> 多数场景用第一种（依赖 `property-specificity` 合并）就够；只有需要禁用态完全不同的交互样式（如去掉 `:hover`）才用第二种。

## 4. Context-driven Styles — 上下文驱动样式

借助"样式是一等对象"，用 React Context 把样式传下去，消费者叠加：

```tsx
const SectionContext = createContext<stylex.StyleXStyles | null>(null)

function Section({ children }: { children: ReactNode }) {
  return (
    <SectionContext.Provider value={styles.dense}>
      <section>{children}</section>
    </SectionContext.Provider>
  )
}

function Item() {
  const sectionStyle = useContext(SectionContext)
  return <div {...stylex.props(styles.item, sectionStyle)} />
}
```

无需专用 API，普通 Context + `StyleXStyles` 类型即可。比 CSS cascade 更显式、可追踪。

## 5. Descendant Styles — 后代样式（`stylex.when`）

伪类只能描述元素自身。要基于**祖先/兄弟状态**驱动样式，用 `stylex.when.*` + marker：

```tsx
const styles = stylex.create({
  card: {
    transform: {
      default: 'translateX(0)',
      [stylex.when.ancestor(':hover')]: 'translateX(10px)',
    },
    color: {
      default: 'inherit',
      [stylex.when.siblingBefore('[data-active]')]: 'red',
    },
  },
})

// 被观察的祖先/兄弟容器要加 marker
<div {...stylex.props(stylex.defaultMarker())}>
  <div {...stylex.props(styles.card)}>hover 父级让我位移</div>
</div>
```

可用选择器：`ancestor` / `descendant` / `anySibling` / `siblingBefore` / `siblingAfter`。也支持属性选择器（`[data-state="open"]`），便于用 ARIA 状态驱动样式。

### 多套独立上下文：`stylex.defineMarker`

表格的 row hover 和 cell hover 互不干扰时，用 `defineMarker` 区分：

```tsx
const rowMarker = stylex.defineMarker()
const cellMarker = stylex.defineMarker()

const styles = stylex.create({
  cell: {
    backgroundColor: {
      default: 'transparent',
      [stylex.when.ancestor(':hover', rowMarker)]: 'rgba(0,0,0,.04)',
    },
  },
})

<tr {...stylex.props(rowMarker)}>            {/* row hover 上下文 */}
  <td {...stylex.props(cellMarker, styles.cell)} />
</tr>
```

### 注意

- `descendant` / `anySibling` / `siblingAfter` 依赖 `:has()`，注意浏览器支持。
- 特异性排序：`ancestor` < `descendant` < `anySibling` < `siblingBefore` < `siblingAfter`（更具体者胜）。

## 6. 样式作 prop 传递

组件接收外部样式并叠加，是 StyleX 的核心组合方式：

```tsx
type CardProps = {
  style?: stylex.StyleXStyles
  children: ReactNode
}

function Card({ style, children }: CardProps) {
  // 默认样式在前，外部 style 在后 → 外部可覆盖
  return <div {...stylex.props(styles.default, style)}>{children}</div>
}

// 消费方
<Card style={styles.highlight}>...</Card>
```

`StyleXStyles` 是可合并的类型；外部传入的样式按 `styleResolution` 与默认样式合并。这是发布可复用组件库的标准模式。

## 7. 速查

| 模式 | 做法 |
|------|------|
| 变体 | 多 `create` 分组 + `keyof typeof` + `props` 组合 |
| 组合变体（简单） | 依赖 `property-specificity` 确定性合并 |
| 组合变体（复杂） | 多套变体集合按条件切换 |
| 上下文驱动 | React Context 传 `StyleXStyles` |
| 后代/兄弟状态 | `stylex.when.*` + `defaultMarker()` |
| 多套 when 上下文 | `stylex.defineMarker()` |
| 可覆盖组件 | `style?: StyleXStyles` prop，默认在前外部在后 |
