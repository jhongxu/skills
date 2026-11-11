---
name: core-components
description: React function components, JSX, props, children, keys, conditional rendering, list rendering, and component purity rules.
---

# Components, JSX & Props

## Defining a component

A component is a plain JavaScript function that returns markup. Rules:

- **Name must start with a capital letter** — lowercase means an HTML tag.
- **Never nest component definitions** inside other components: they get remounted on every render (new function identity → new component type → state loss, slow).
- Prefer `export default function Name()` for the primary export; named exports for others.
- Split components into their own files once a file gets crowded.

```tsx
// ✅ one component per module
export default function Profile({ name }: { name: string }) {
  return <h1>{name}</h1>
}
```

Class components (`class X extends Component`) are still supported but **not recommended** in new code.

## JSX essentials

- A component returns JSX; a multi-line return must be wrapped in parentheses (otherwise ASI swallows the code).
- `{expression}` injects any JavaScript value into markup. `{{ ... }}` is an object literal inside the braces.
- JSX is stricter than HTML: every tag must be closed, attributes are camelCase (`className`, `tabIndex`, `onClick`).
- Comments inside JSX use `{/* ... */}`.

```tsx
<div className="card" data-testid="card">
  {user ? <Avatar user={user} /> : <Fallback />}
  {items.length > 0 && <List items={items} />}
</div>
```

## Props

Props are the component's only argument — a single `props` object. Destructure it in the parameter list:

```tsx
function Avatar({ person, size = 100 }: { person: Person; size?: number }) {
  return <img src={person.imageUrl} width={size} height={size} />
}
```

- **Default values** come from destructuring defaults. They apply only when the prop is `undefined` — **not** for `null` or `0`.
- **Spread** (`{...props}`) forwards everything. Use it with restraint: spreading everywhere usually means the component should instead accept `children`.
- **Children**: anything nested inside a JSX tag arrives as the `children` prop. A component with `children` is a "slot" that the parent fills.

```tsx
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>
}
// <Card><Avatar /></Card>  →  Card receives <Avatar /> as children
```

- Props are **read-only**. Never mutate them; ask the parent to change the value.

## Conditional rendering

```tsx
{isLoggedIn ? <Dashboard /> : <Login />}
{items.length > 0 && <List items={items} />}
{/* ⚠️ `0 && <X/>` renders "0" — coerce with Boolean() or use a ternary */}
```

Prefer a ternary with `null` over `&&` when the falsy value could be `0` or `""`.

## Rendering lists

```tsx
<ul>
  {people.map((person) => (
    <li key={person.id}>{person.name}</li>
  ))}
</ul>
```

### Key rules

- Every element directly inside `map()` needs a `key` — a string or number unique among its **siblings**.
- `key` is **not** passed to the component as a prop. It is consumed by React.
- Use a **stable id from your data** (`person.id`), never the array index — the index changes when items are reordered, inserted or deleted, and React will then reuse the wrong state and DOM.
- The key must be unique among siblings only; the same key in two different lists is fine.
- A key does **not** have to be globally unique — it only needs to identify the item within its array.
- When one item renders multiple DOM nodes, use `<Fragment key={id}>`.

### Mutating vs copying arrays

`push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse` **mutate** the original array.
`slice`, `filter`, `map`, `concat` **create a new one**.

```tsx
const next = [...items, item]        // ✅
const next = items.push(item)        // ❌ mutates props/state
```

## Purity

A pure component:

1. **Minds its own business** — does not modify any object or variable that existed before the call.
2. **Same input → same output** — for the same props, returns the same result.

During rendering, React components must not:

- mutate props or state,
- modify a variable declared outside the component,
- call a function that mutates a pre-existing object (e.g. `arr.push()` on a prop),
- `Date.now()`, `Math.random()`, or read/write globals.

Fix impure rendering by **copying** the data and setting state instead:

```tsx
// ❌ mutates the prop
function StoryTray({ stories }) {
  stories.push({ id: 'new' })          // breaks purity, double-added in StrictMode
}

// ✅ copy, then set state
const [items, setItems] = useState(stories)
function add() { setItems([...items, { id: 'new' }]) }
```

React's **StrictMode** calls components twice in development to surface impurity — treat a double-render bug as a purity bug.

Communication between components happens **only through props**. React does not guarantee the order in which component functions run, so a module-level variable is never a valid channel.

## Rendering model

- **Render tree**: parent/child relationships between components — drives data flow and re-render scope.
- **Module dependency tree**: which modules import which — drives bundle size. Use it to debug bundle regressions.
- Rendering is a **calculation**, not a side effect. If you need the DOM, use a ref or an effect.

<!--
Source references:
- https://react.dev/learn/your-first-component
- https://react.dev/learn/describing-the-ui
- https://react.dev/learn/passing-props-to-a-component
- https://react.dev/learn/conditional-rendering
- https://react.dev/learn/rendering-lists
- https://react.dev/learn/keeping-components-pure
- https://react.dev/learn/understanding-your-ui-as-a-tree
-->
