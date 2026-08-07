# UnoCSS

> 面向 `unocss` + `@unocss/preset-wind4`（Tailwind CSS v4 兼容预设）。按需原子 CSS 引擎，开发期比 Tailwind 快一个数量级（按需生成而非扫描文件）。Anthony Fu 出品，Vite 生态首选。

为什么用它：on-demand 生成（HMR ~10ms 不随项目规模增长）、preset 系统（可同时用多套 utility 语法）、Tailwind v4 类名兼容（`presetWind4`）、纯 JS/TS 配置（断点/主题/暗模式都在 `uno.config.ts`）、rules/variants/shortcuts 完全可编程。

## 1. 安装与接入 Vite

```bash
pnpm add -D unocss @unocss/preset-wind4
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    UnoCSS(),          // 放靠前，让其他插件能处理它生成的虚拟模块
    react(),
  ],
})
```

```ts
// uno.config.ts
import { defineConfig, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),
  ],
})
```

```ts
// main.ts —— 必须引入虚拟模块
import 'virtual:uno.css'
```

## 2. Vite 插件模式

```ts
UnoCSS({
  mode: 'global',      // 默认：生成全局样式表，需 import 'virtual:uno.css'
  // mode: 'vue-scoped',   // 注入到 Vue SFC <style scoped>，做隔离
  // mode: 'shadow-dom',   // Web Components，inline 到 Shadow DOM
  // mode: 'per-module',   // 实验性：每个模块独立生成
})
```

React 项目用默认 `global`。`vue-scoped` 只对 Vue 有意义。

## 3. presetWind4（Tailwind v4 兼容）

核心预设，类名与 Tailwind v4 一致：

```ts
import { defineConfig, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4({
      preflights: {
        reset: true,       // 内置 CSS reset（不用再装 @unocss/reset）
        theme: 'on-demand', // 主题变量生成模式：true | false | 'on-demand'（默认）
        property: true,    // 生成 @property 规则
      },
    }),
  ],
})
```

### 内置 reset 取代 `@unocss/reset`

Wind4 内置了 Tailwind v4 的 reset，不再需要：

```diff
- import '@unocss/reset/tailwind.css'
- import '@unocss/reset/tailwind-compat.css'
```

直接在配置里 `preflights.reset: true`。

### OKLCH 色彩模型

Wind4 用 `oklch` 替代 `rgb`，色彩感知更准。**不兼容** `presetLegacyCompat`（用 rgb 的）。迁移时检查颜色输出。

### `@property` 规则

用 `@property` 定义 CSS 自定义属性，性能更好、体积更小：

```css
/* Wind4 自动生成 */
@property --un-text-opacity {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 100%;
}
```

## 4. 主题配置（Wind4 键名变了）

Wind4 的 theme 键名与 Wind3 不同，迁移要对照改：

```ts
import { defineConfig, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [presetWind4()],
  theme: {
    // Wind3: fontFamily → Wind4: font
    font: {
      sans: 'Inter, ui-sans-serif, system-ui',
      mono: 'JetBrains Mono, ui-monospace',
    },
    // Wind3: borderRadius → Wind4: radius
    radius: {
      lg: '0.75rem',
    },
    // Wind3: boxShadow → Wind4: shadow（新增 insetShadow）
    shadow: {
      card: '0 2px 8px rgba(0,0,0,0.1)',
    },
    // Wind3: breakpoints → Wind4: breakpoint
    breakpoint: {
      sm: '640px',
      md: '768px',
    },
    // Wind3: easing → Wind4: ease
    ease: {
      'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    // 尺寸类（width/height/maxWidth 等）统一用 spacing
    spacing: {
      '128': '32rem',
    },
  },
})
```

### 键名迁移对照

| presetWind3 | presetWind4 |
|-------------|-------------|
| `fontFamily` | `font` |
| `fontSize` | `text.fontSize`（或用 `text-*` 工具类） |
| `lineHeight` | `text.lineHeight` 或 `leading` |
| `letterSpacing` | `text.letterSpacing` 或 `tracking` |
| `borderRadius` | `radius` |
| `easing` | `ease` |
| `breakpoints` | `breakpoint` |
| `verticalBreakpoints` | `verticalBreakpoint` |
| `boxShadow` | `shadow`（新增 `insetShadow`） |
| `transitionProperty` | `property` |
| `container.maxWidth` | `containers.maxWidth` |
| `width`/`height`/`maxWidth` 等 | 统一到 `spacing` |
| - | `defaults`（全局默认，见下） |

### Theme.defaults（全局默认）

应用到 reset 与部分规则的默认值：

```ts
import type { Theme } from '@unocss/preset-wind4/theme'

const defaults: Theme['defaults'] = {
  transition: {
    duration: '150ms',
    timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  font: {
    family: 'var(--font-sans)',
    featureSettings: 'var(--font-sans--font-feature-settings)',
    variationSettings: 'var(--font-sans--font-variation-settings)',
  },
  monoFont: {
    family: 'var(--font-mono)',
    // ...
  },
}
```

## 5. rem 转 px（取代 presetRemToPx）

Wind4 内建 processor，不用单独装 `presetRemToPx`：

```ts
import { createRemToPxProcessor } from '@unocss/preset-wind4/utils'
import { defineConfig, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4({
      preflights: {
        theme: {
          mode: 'on-demand',
          process: createRemToPxProcessor(),   // 主题变量也转
        },
      },
    }),
  ],
  // 工具类输出也转
  postprocess: [createRemToPxProcessor()],
})
```

## 6. shortcuts（组合工具类）

```ts
import { defineConfig, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [presetWind4()],
  shortcuts: {
    // 静态
    'btn': 'inline-flex items-center justify-center px-4 py-2 rounded-md font-medium',
    'btn-primary': 'btn bg-blue-600 text-white hover:bg-blue-700',
    // 动态（匹配模式）
    'btn-variant-(\\w+)': 'btn bg-$1-600 text-white',
  },
})
```

```tsx
<button className="btn-primary">Save</button>
<button className="btn-variant-red">Delete</button>
```

## 7. rules（自定义工具类）

```ts
import { defineConfig, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [presetWind4()],
  rules: [
    // 字符串键
    ['m-c', 'margin: auto'],
    // 函数式（动态）
    [/^m-(\d+)$/, ([, d]) => ({ margin: `${d / 4}rem` })],
    // 带 matcher 对象
    [/^w-(\d+)px$/, ([, d]) => ({ width: `${d}px` })],
  ],
})
```

## 8. variants（变体）

```ts
import { defineConfig, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [presetWind4()],
  variants: [
    // 自定义变体
    (matcher) => {
      if (matcher.startsWith('foo:')) {
        return {
          matcher: matcher.slice(4),
          selector: s => `.foo ${s}`,
        }
      }
    },
  ],
})
```

内置变体：`hover:`、`focus:`、`md:`（断点）、`dark:`、`disabled:` 等。

## 9. transformers（预处理 class 字符串）

```bash
pnpm add -D @unocss/transformer-variant-group @unocss/transformer-directives
```

```ts
import { defineConfig, presetWind4 } from 'unocss'
import transformerVariantGroup from '@unocss/transformer-variant-group'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
  presets: [presetWind4()],
  transformers: [
    transformerVariantGroup(),   // hover:(bg-red text-white) → hover:bg-red hover:text-white
    transformerDirectives(),     // CSS 里的 @apply / @screen / theme()
  ],
})
```

```tsx
// variant-group：少写很多 hover:
<div className="hover:(bg-red-500 text-white)" />

// directives：在 CSS 里用
// .card { @apply rounded-lg shadow; }
```

## 10. 与组件库共存（CSS layers）

跟 Vuetify/其他 UI 库一起用时，用 `outputToCssLayers` 控制 layer 顺序，避免 UnoCSS 被组件库覆盖：

```ts
import { defineConfig, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4({
      preflights: { reset: false },   // 关 reset，用组件库的
    }),
  ],
  outputToCssLayers: {
    cssLayerName: layer => layer === 'properties' ? null : `uno-${layer}`,
  },
})
```

CSS 里声明 layer 顺序（`uno-` 系列放在组件样式之上）：

```css
@layer uno-base, uno-theme, vuetify-core, vuetify-components, uno-default;
```

## 11. safelist（动态 class 名）

运行时拼接的 class（如 `bg-${color}-500`）UnoCSS 静态分析看不到，需要 safelist：

```ts
export default defineConfig({
  safelist: [
    'bg-red-500',
    'bg-blue-500',
    // 或模式
    (matcher) => matcher.startsWith('text-') ? matcher : undefined,
  ],
})
```

## 12. Inspector（调试）

```bash
# 启动后访问 http://localhost:5173/__unocss
pnpm vite
```

UI 里看所有生成的工具类、命中的 rules、主题解析结果。调自定义 rule 必备。

## 13. CLI 检查

```bash
# 看某个 class 会生成什么 CSS
pnpm unocss "p-4 text-red-500"
```

## 14. 生成的 CSS 层

Wind4 新增两个 layer：

| Layer | 说明 | 顺序 |
|-------|------|------|
| `properties` | `@property` 定义的 CSS 属性 | -200 |
| `theme` | 主题 CSS 变量 | -150 |
| `base` | reset/preflight | -100 |

## 15. 从 Wind3 迁移

1. 换 `presetWind3` → `presetWind4`
2. 按对照表改 theme 键（`fontFamily` → `font` 等）
3. 删 `@unocss/reset` 的 import，开 `preflights.reset: true`
4. 测试颜色输出（oklch 替代 rgb）
5. `presetRemToPx` 换成 `createRemToPxProcessor`
6. 检查 `presetLegacyCompat`——与 Wind4 不兼容，移除

## 16. 与本仓库其他 skill 的衔接

- 用 [pnpm](pnpm.md) 装。
- Vite 项目里插件放靠前；配合 [vitest](vitest.md) 测试时 UnoCSS 虚拟模块需在 setup 里处理。
- 代码风格用 [eslint-antfu](eslint-antfu.md)；开 `unocss: true` 校验 class 名。
- React 组件里用工具类见 [react](../react/SKILL.md) / [ui](../ui/SKILL.md) skill。
- 与 [stylex](../stylex/SKILL.md) 是两种 CSS 方案：UnoCSS 是原子工具类、StyleX 是 CSS-in-JS，二选一。

## 17. 坑

| 坑 | 说明 |
|----|------|
| class 没生效 | 拼接的动态 class 用 safelist；或 Inspector 里查有没有生成 |
| 颜色和 Wind3 不一样 | Wind4 用 oklch，感知更准但数值不同；检查设计稿对齐 |
| 与 `presetLegacyCompat` 一起用报错 | 不兼容 oklch，移除 legacy |
| reset 把组件库样式干掉 | `preflights.reset: false`，用组件库的 reset |
| UnoCSS 被 Vuetify 等覆盖 | 用 `outputToCssLayers` 控制 layer 顺序 |
| `virtual:uno.css` 没引入 | main.ts 必须有 `import 'virtual:uno.css'`（global 模式） |
| theme 键不生效 | Wind4 改键名了，按对照表改（`fontFamily` → `font`） |
| rem 单位想转 px | 用 `createRemToPxProcessor`，别再装 `presetRemToPx` |
| HMR 慢 | 检查是不是误开了 Tailwind 的 PostCSS 插件，二者只留一个 |
| `@apply` 在 CSS 里报错 | 没装 `@unocss/transformer-directives` |
