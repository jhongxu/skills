# Component Patterns

> 面向 React 19.2+。讲组件设计与组合，不讲文件目录约定（那属于 `react-component-conventions` skill）。样式相关见 [../ui/SKILL.md](../../ui/SKILL.md)。

## 1. 组合优于继承

React 没有组件继承。复用走两条路：**组合（children / slots）** 与 **自定义 hook（逻辑）**。

### 用 children 做 slot

```tsx
function Card({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="card">
      <header className="card__action">{action}</header>
      <div className="card__body">{children}</div>
    </section>
  )
}

<Card action={<DeleteButton />}>
  <p>正文</p>
</Card>
```

### 复合组件：共享 context 的「家族」

```tsx
const TabsContext = createContext<{ value: string; setValue: (v: string) => void } | null>(null)

function Tabs({ defaultValue, children }: { defaultValue: string; children: React.ReactNode }) {
  const [value, setValue] = useState(defaultValue)
  return <TabsContext value={{ value, setValue }}>{children}</TabsContext>
}

function TabList({ children }: { children: React.ReactNode }) {
  return <div role="tablist">{children}</div>
}

function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = use(TabsContext)
  if (!ctx) throw new Error('Tab must be inside <Tabs>')
  const active = ctx.value === value
  return (
    <button role="tab" aria-selected={active} onClick={() => ctx.setValue(value)}>
      {children}
    </button>
  )
}

// 使用：API 扁平、可读
<Tabs defaultValue="a">
  <TabList>
    <Tab value="a">A</Tab>
    <Tab value="b">B</Tab>
  </TabList>
</Tabs>
```

把 context 留在文件内部不导出，强制成对使用；子组件用 `use(ctx)` 并在缺失时抛错，给出明确报错。

## 2. Render Props / 函数子组件

当子组件需要「基于父组件状态决定渲染什么」时：

```tsx
function List<T>({ items, render }: { items: T[]; render: (item: T, i: number) => React.ReactNode }) {
  return <ul>{items.map((item, i) => <li key={i}>{render(item, i)}</li>)}</ul>
}

<List items={users} render={u => <UserCard user={u} />} />
```

更常见的是 `children as function`：

```tsx
function Hoverable({ children }: { children: (hovered: boolean) => React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <span onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {children(hovered)}
    </span>
  )
}

<Hoverable>{h => h ? '👆' : '👇'}</Hoverable>
```

> 优先级：能 `children` 就别 render props；能 render props 就别 `cloneElement`（后者隐式依赖、难追踪）。

## 3. 自定义 Hook 抽逻辑

组件胖了先抽 hook，而不是抽组件：

```tsx
// 抽出前：组件里混着数据获取
function Profile({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => { fetchUser(id).then(setUser) }, [id])
  if (!user) return <Spinner />
  return <div>{user.name}</div>
}

// 抽出后：逻辑可测、可复用
function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => { fetchUser(id).then(setUser) }, [id])
  return user
}

function Profile({ id }: { id: string }) {
  const user = useUser(id)
  if (!user) return <Spinner />
  return <div>{user.name}</div>
}
```

命名以 `use` 开头（强制规则，否则 React Hooks 插件不认、并发渲染下会出错）。数据获取这种场景，生产里优先用 TanStack Query（见 [../tanstack/references/query.md](../../tanstack/references/query.md)）而非手写。

## 4. 受控 vs 非受控

```tsx
// 受控：value 由父控制，onChange 上报
<Input value={text} onChange={setText} />

// 非受控：内部持有状态，ref 暴露命令式 API
<Input defaultValue={text} ref={inputRef} />
```

设计可复用输入组件时，**同时支持两种**，约定 `value`/`defaultValue` + 可选 `onChange`：

```tsx
type InputProps = {
  defaultValue?: string
  value?: string
  onChange?: (v: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>

function Input({ value, defaultValue, onChange, ...rest }: InputProps) {
  return <input value={value} defaultValue={defaultValue} onChange={e => onChange?.(e.target.value)} {...rest} />
}
```

## 5. 错误边界

错误边界**仍只能用 class 组件**（19 未提供 hook 等价物）。捕获渲染、生命周期、子树里的抛错——**不**捕获事件处理器、`setTimeout`、async 里的错误（那些要 try/catch）。

```tsx
import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback: (error: Error, reset: () => void) => ReactNode }
interface State { error: Error | null }

class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // 上报到监控
    console.error(error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, () => this.setState({ error: null }))
    }
    return this.props.children
  }
}

// 使用：边界越细，故障越局部
<ErrorBoundary fallback={(e, reset) => <ErrorCard error={e} onRetry={reset} />}>
  <UserProfile />
</ErrorBoundary>
```

要点：
- 边界放在「可恢复的子树」外层，别整个 app 套一个。
- `use(promise)` reject 时也走错误边界（见 [concurrent-features.md](concurrent-features.md)）。

## 6. Props 设计

### 避免 boolean 地狱

```tsx
// ❌ 4 个布尔组合出 2^4 = 16 种状态，多数非法
<Button primary disabled outline rounded />

// ✅ 用判别联合
type Variant = 'primary' | 'secondary' | 'ghost'
<Button variant="primary" disabled shape="rounded" />
```

### 单一职责，prop 数量超 6 个就考虑拆

```tsx
// ❌ 一个组件什么都管
<Modal open onClose title footer closable escClose overlayClose width height />

// ✅ 复合：把 footer/标题交给 children
<Modal open onClose>
  <Modal.Header title="确认" />
  <Modal.Body>...</Modal.Body>
  <Modal.Footer><Button>确定</Button></Modal.Footer>
</Modal>
```

## 7. 渲染纯净：别在渲染里造新东西

```tsx
function Bad({ items }: { items: Item[] }) {
  // ❌ 每次渲染新建组件类型 → React 卸载重建整个子树，状态丢失
  const Row = ({ item }: { item: Item }) => <li>{item.name}</li>
  return <ul>{items.map(i => <Row key={i.id} item={i} />)}</ul>
}

function Good({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map(i => <li key={i.id}>{i.name}</li>)}
    </ul>
  )
}
```

同理别在渲染里 `new Date()` / 生成随机数 / 发请求——渲染必须是纯函数。需要副作用进 `useEffect`，需要稳定值进 `useMemo`（或交给 React Compiler）。

## 8. 受控展开：`ReactNode` vs `children`

把可扩展点显式做成 prop，比塞 `children` 更清晰：

```tsx
function Page({ header, sidebar, children }: {
  header: ReactNode
  sidebar?: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <header>{header}</header>
      <main>{children}</main>
      {sidebar && <aside>{sidebar}</aside>}
    </div>
  )
}
```

## 9. 提取时机

- **组件超 200 行**或 **`useState`/`useEffect` 超过 5 个** → 抽 hook 或拆子组件。
- **同一段 JSX 出现 2 次** → 抽组件。
- **一段逻辑与 UI 无关** → 抽自定义 hook。
- **props 透传超过 2 层** → 用 context（见 [core-hooks.md](core-hooks.md) 的 Context 段）。
