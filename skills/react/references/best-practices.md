---
name: best-practices
description: Thinking in React workflow, declarative UI, TypeScript setup, component structure, testing, and debugging with React DevTools.
---

# Best Practices

## Thinking in React

The official workflow for building a UI from a mockup + data model:

1. **Break the UI into a component hierarchy.** Draw boxes around every piece, name them. If the JSON is well structured, the component structure usually mirrors the data model.
2. **Build a static version first.** Render the data model without interactivity — it is easier to get right, and it separates markup errors from state errors.
3. **Find the minimal state.** Keep only what cannot be computed from props/other state. Remove redundant, derived, and mirrored state.
4. **Decide where state lives.** The owner is the **closest common parent** of every component that reads it. If no single component needs it, don't store it.
5. **Add data flow.** Pass data **down** with props; pass callbacks **up**. "Inverse data flow" — a child that needs to change parent state receives a callback prop.
6. **Add interactivity last.** Now wire the event handlers.

## Declarative UI

Instead of imperatively toggling DOM nodes, **declare the states** and let React switch between them:

1. Identify your component's different **visual states**.
2. Determine what **triggers** each state change.
3. Represent the state in memory with `useState`.
4. Remove any **non-essential** state variables.

```tsx
const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
return status === 'submitting' ? <Spinner /> : status === 'success' ? <Thanks /> : <Form />
```

## TypeScript

- Every file with JSX uses the **`.tsx`** extension.
- Install `@types/react` and `@types/react-dom`.
- `tsconfig.json` needs `"lib": ["dom", ...]` and `"jsx": "preserve"` (or another valid option).
- Type props with an object type — `interface` or `type` — and let the Hook types be inferred:

```tsx
interface AvatarProps { person: Person; size?: number }

export function Avatar({ person, size = 100 }: AvatarProps) { /* ... */ }

const [enabled, setEnabled] = useState(false)   // inferred as boolean
const [items, setItems] = useState<Item[]>([]) // explicit when inference is not enough
```

- `React.ReactNode` is the usual type for `children`; `React.FC` is **not** needed (and React 19 types no longer imply `children` for it).
- Type event handlers with the specific event type: `(e: React.ChangeEvent<HTMLInputElement>) => void`.

## Component structure

- One component per file once it grows; keep tiny helpers next to their user.
- Colocate by feature (`features/cart/Cart.tsx`), not by type (`components/Button.tsx`).
- Prefer composition over configuration — pass `children` instead of a `renderFooter` prop.
- Keep component props typed and minimal; a component with 12 props is usually several components.

## Forms

- Prefer **controlled** inputs for anything that must be validated or submitted: `value={value} onChange={e => setValue(e.target.value)}`.
- Uncontrolled inputs (`defaultValue`) are fine for simple cases — do not mix controlled and uncontrolled for the same input.
- Use a form `action` (Server Function or `useActionState` dispatch) for submissions so they work without JS.

## Testing

- Use React Testing Library: query by **role/label/text**, not by test id or CSS class.
- `userEvent` simulates real interaction; `fireEvent` is a last resort.
- Test behaviour from the user's perspective; avoid asserting on internal state.
- `act` is handled by RTL — do not call it manually.
- React 19: `react-test-renderer` and `react-dom/test-utils` are **deprecated** — use `@testing-library/react`.

## Debugging

- **React DevTools**: the Profiler shows what rendered and why ("why did this render?"); the Components tree shows props/state; there are performance tracks for React 19.
- **Error Boundaries** (`class extends Component` with `getDerivedStateFromError` / `componentDidCatch`) catch render errors of their subtree. They do **not** catch errors in event handlers or async code — handle those explicitly.
- **StrictMode** in development double-invokes render and effects to surface impurity and missing cleanups. Keep it enabled.
- Warnings about missing `key`, invalid nesting (`<div>` inside `<p>`), or hydration mismatches are real bugs — fix them, do not silence them.

<!--
Source references:
- https://react.dev/learn/thinking-in-react
- https://react.dev/learn/reacting-to-input-with-state
- https://react.dev/learn/adding-interactivity
- https://react.dev/learn/typescript
- https://react.dev/reference/react/Component
- https://react.dev/reference/dev-tools/react-devtools-cdt-mcp
-->
