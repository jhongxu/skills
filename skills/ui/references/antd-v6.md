# Ant Design v6

> 面向 `antd@6.5`（2025-11-22 发布，最新 6.5.4 @ 2026-08-07）。v6 是一次技术升级：**组件 API 保持兼容**，但环境要求提高、命名规范统一、CSS 变量默认开启。React 栈中后台组件库默认选型。

为什么用 v6 而不是 v5：CSS 变量模式默认开（渲染性能更好、主题切换零成本）、命名统一为 `start/end` + `Placement`/`Orientation`（原生 RTL 支持）、`zeroRuntime` 模式可去运行时样式生成、官方 CLI 辅助升级与诊断、新组件（Input.OTP、BorderBeam）、弹层 `mask` 支持模糊。

## 1. 安装与环境要求

```bash
pnpm add antd@6 @ant-design/icons@6
```

| 项 | 要求 |
|----|------|
| React | **>= 18**（不再支持 17 及以下；原生支持 19，无需 patch） |
| `@ant-design/icons` | **>= 6.0.0**，且与 antd@5 **不兼容**，必须成对升级 |
| 浏览器 | 仅现代浏览器，**不支持 IE** |
| CSS Variables | **默认开启** |

```diff
- import '@ant-design/v5-patch-for-react-19'   // 用了就删
```

## 2. v6 核心变化（必须知道）

### 2.1 命名统一：`Position` → `Placement`，`direction`/`type` → `orientation`

v6 把"物理位置"改成"逻辑位置"（`start`/`end`），天然支持 RTL：

| 组件 | v5（废弃） | v6 |
|------|-----------|-----|
| Button | `iconPosition` | `iconPlacement` |
| Carousel | `dotPosition` | `dotPlacement` |
| Collapse | `expandIconPosition` | `expandIconPlacement` |
| Tabs | `tabPosition` | `tabPlacement` |
| Steps | `labelPlacement` | `titlePlacement` |
| Progress | `gapPosition` | `gapPlacement` |
| Table.pagination | `position` | `placement` |
| Space / Space.Compact | `direction` | `orientation` |
| Splitter | `layout` | `orientation` |
| Steps | `direction` | `orientation` |
| Divider | `type` | `orientation` |
| Timeline | `mode="left"`/`"right"` | `mode="start"`/`"end"` |

```diff
- <Button iconPosition="left" />
- <Space direction="vertical" />
- <Timeline mode="left" />
+ <Button iconPlacement="start" />
+ <Space orientation="vertical" />
+ <Timeline mode="start" />
```

### 2.2 样式 props → `styles` / `classNames` 对象

散落的 `xxxStyle` 统一进 `styles` 对象，`xxxClassName` 进 `classNames`：

| 组件 | v5（废弃） | v6 |
|------|-----------|-----|
| Card | `headStyle` / `bodyStyle` | `styles.header` / `styles.body` |
| Modal | `bodyStyle` / `maskStyle` | `styles.body` / `styles.mask` |
| Drawer | `headerStyle` / `bodyStyle` / `footerStyle` / `maskStyle` / `contentWrapperStyle` / `drawerStyle` | `styles.header` / `.body` / `.footer` / `.mask` / `.wrapper` / `.section` |
| Descriptions | `labelStyle` / `contentStyle` | `styles.label` / `styles.content` |
| Statistic | `valueStyle` | `styles.content` |
| Image | `wrapperStyle` | `styles.root` |
| Tooltip | `overlayStyle` / `overlayInnerStyle` | `styles.root` / `styles.container` |
| Transfer | `listStyle` / `operationStyle` | `styles.section` / `styles.actions` |
| Empty | `imageStyle` | `styles.image` |

```diff
- <Card headStyle={{ color: 'red' }} bodyStyle={{ padding: 0 }} />
- <Modal bodyStyle={{ maxHeight: 400 }} />
+ <Card styles={{ header: { color: 'red' }, body: { padding: 0 } }} />
+ <Modal styles={{ body: { maxHeight: 400 } }} />
```

### 2.3 弹层类 API 统一（`dropdown*` → `popup*`）

AutoComplete / Select / Cascader / TreeSelect / DatePicker 等弹层组件统一为 `popup*` 命名：

| v5（废弃） | v6 |
|-----------|-----|
| `dropdownMatchSelectWidth` | `popupMatchSelectWidth` |
| `dropdownClassName` / `popupClassName` | `classNames.popup.root` |
| `dropdownStyle` | `styles.popup.root` |
| `dropdownRender` | `popupRender` |
| `onDropdownVisibleChange` | `onOpenChange` |

### 2.4 结构性废弃（影响较大）

- `BackTop` → `FloatButton.BackTop`
- `Button.Group` → `Space.Compact`
- `Breadcrumb.Item` / `Breadcrumb.Separator` → `items`
- `Anchor children` → `items`
- `Breadcrumb` 的 `routes` / `breadcrumbName` → `items` / `title`
- `Card` 的 `bordered` → `variant`；`tab` → `label`
- `Avatar` `size="default"` → `size="medium"`（6.3.0）
- `Avatar.Group` 的 `maxCount` / `maxStyle` / `maxPopoverPlacement` / `maxPopoverTrigger` → `max={{ count, style, popover }}`
- `Alert` 的 `closeText` / `closeIcon` / `message` / `onClose` / `afterClose` → `closable.closeIcon` / `title` / `closable.onClose` / `closable.afterClose`

```diff
- <Breadcrumb>
-   <Breadcrumb.Item>Home</Breadcrumb.Item>
-   <Breadcrumb.Item>List</Breadcrumb.Item>
- </Breadcrumb>
+ <Breadcrumb items={[{ title: 'Home' }, { title: 'List' }]} />

- <Avatar.Group maxCount={3} maxStyle={{ backgroundColor: '#ccc' }}>
+ <Avatar.Group max={{ count: 3, style: { backgroundColor: '#ccc' } }}>
```

### 2.5 新能力

- **CSS 变量默认开**：`cssVar: true` 默认，主题切换不重算样式
- **`zeroRuntime`**：见 [icon-and-theming](icon-and-theming.md)
- **弹层 `mask` 模糊**：Modal / Drawer 等支持蒙层模糊效果
- **新组件**：`Input.OTP`（验证码输入）、`BorderBeam`（边框光效）
- **`showArrow` 默认开**：Arrow 不再需要显式声明，要隐藏设 `suffixIcon={null}`
- **Ant Design CLI**（`npx antd`）：见下文

## 3. Ant Design CLI（`npx antd`）

官方命令行工具，升级与诊断必备：

```bash
# 检查废弃 API、组件用法、版本差异（基于项目代码）
npx antd lint

# 只看 diff 范围（CI 友好）
npx antd lint --diff main
npx antd lint --staged

# 查组件 API、取示例代码
npx antd docs Button

# 诊断项目配置
npx antd doctor

# 一键 setup（含 GitHub Actions CI 配置）
npx antd setup
```

升级 v5→v6 时先用 `npx antd lint` 扫一遍，比对着文档逐项核对更靠谱。

## 4. App 组件（解决静态方法丢失 context 的问题）

`message.xxx` / `Modal.xxx` / `notification.xxx` 静态方法拿不到 ConfigProvider context（主题、i18n 都失效）。v6 用 `App` 组件包裹，并提供 `App.useApp()`：

```tsx
import { App } from 'antd'

export default function Root() {
  return (
    <ConfigProvider theme={...}>
      <App>
        <MyPage />
      </App>
    </ConfigProvider>
  )
}

function MyPage() {
  const { message, modal, notification } = App.useApp()

  const onClick = async () => {
    await modal.confirm({ title: '确定删除？', content: '不可恢复' })
    message.success('已删除')
  }
  return <button onClick={onClick}>删除</button>
}
```

`App.useApp()` 返回的实例**带 context**（主题/语言/动效都生效）。中后台一律用这个，别用 `message.success()` 静态方法。

## 5. 常用组件实战

### Form + Form.Item

```tsx
import { Form, Input, Button, App } from 'antd'

function MyForm() {
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const onFinish = async (values) => {
    await api.save(values)
    message.success('保存成功')
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ name: '' }}
    >
      <Form.Item
        name="name"
        label="名称"
        rules={[{ required: true, message: '请输入名称' }]}
      >
        <Input placeholder="输入名称" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">提交</Button>
      </Form.Item>
    </Form>
  )
}
```

> 更复杂的表单（校验时机、异步校验、数组字段、Standard Schema 集成）推荐 TanStack Form，见 [../../tanstack/references/form.md](../../tanstack/references/form.md)。Zod schema 见 [../../data-and-forms/references/zod.md](../../data-and-forms/references/zod.md)。

### Table

```tsx
import { Table } from 'antd'
import type { TableProps } from 'antd'

type Person = { key: string; name: string; age: number }

const columns: TableProps<Person>['columns'] = [
  { title: '姓名', dataIndex: 'name' },
  { title: '年龄', dataIndex: 'age', sorter: (a, b) => a.age - b.age },
]

export function PersonTable({ data }: { data: Person[] }) {
  return (
    <Table<Person>
      columns={columns}
      dataSource={data}
      pagination={{ placement: 'bottomRight' }}   // v6: placement（非 position）
    />
  )
}
```

> 大规模表格（虚拟化、细粒度订阅、声明式特性）用 TanStack Table v9，见 [../../tanstack-table/references/core.md](../../tanstack-table/references/core.md)。

### Select / Cascader

```tsx
<Select
  options={[{ label: 'A', value: 'a' }]}
  popupMatchSelectWidth          // v6: 替代 dropdownMatchSelectWidth
  styles={{ popup: { root: { width: 200 } } }}   // v6: 替代 dropdownStyle
/>
```

## 6. v5 → v6 迁移清单

1. 先升到 **v5 最新版**，按 console warning 清掉已废弃 API
2. 确认 **React >= 18**
3. `pnpm add antd@6 @ant-design/icons@6`（必须成对升）
4. 删 `@ant-design/v5-patch-for-react-19`
5. 跑 `npx antd lint`，按报告改：`*Position`→`*Placement`、`direction`/`type`→`orientation`、`*Style`→`styles.*`、`dropdown*`→`popup*`、`Breadcrumb.Item`→`items` 等
6. 检查自定义样式是否依赖组件内部 DOM 结构（v6 调整了 DOM）
7. 测试主题（CSS 变量默认开，颜色计算可能略有差异）

> v5→v6 是平滑升级：API 兼容（废弃项仍可用，只打 warning），无需 codemod。废弃项将在 7.0 移除，建议尽早迁移。

## 7. 与本仓库其他 skill 的衔接

- 用 [../../foundation/references/pnpm.md](../../foundation/references/pnpm.md) 装。
- 主题、图标、暗色模式见 [icon-and-theming](icon-and-theming.md)。
- 工具类方案用 [../../foundation/references/unocss.md](../../foundation/references/unocss.md)（presetWind4）；与 antd 共存用 CSS layers。
- 代码风格用 [../../foundation/references/eslint-antfu.md](../../foundation/references/eslint-antfu.md)。
- 表单/表格的进阶场景见 [../../tanstack/references/form.md](../../tanstack/references/form.md) 与 [../../tanstack-table/SKILL.md](../../tanstack-table/SKILL.md)。
- URL 状态同步见 [../../nuqs/SKILL.md](../../nuqs/SKILL.md)（分页/筛选存 URL）。

## 8. 坑

| 坑 | 说明 |
|----|------|
| `@ant-design/icons@6` 装了但 antd@5 | 不兼容，必须成对升级；检查 lockfile |
| `message.success()` 没主题 | 静态方法丢 context，改用 `App.useApp()` 的 `message` |
| `tabPosition` / `direction` 报警告 | v6 改名 `tabPlacement` / `orientation`，旧名仍可用但 deprecated |
| `headStyle` 不生效 | 改 `styles.header`；散落 style props 全进 `styles` |
| 升级后样式错乱 | v6 调整了组件 DOM 结构，检查是否写了依赖内部选择器的自定义样式 |
| `dropdownClassName` 无效 | 改 `classNames.popup.root` |
| CSS 变量与组件库冲突 | antd 默认开 cssVar；与 UnoCSS/其他库共存时配 CSS layers |
| `zeroRuntime` 开了组件没样式 | 需手动 `import 'antd/dist/antd.css'`，见 [icon-and-theming](icon-and-theming.md) |
| `BackTop` 没了 | 用 `FloatButton.BackTop` |
