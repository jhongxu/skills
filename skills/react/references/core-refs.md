---
name: core-refs
description: useRef for DOM access and non-render values, escape hatches for the DOM, and the difference between refs and state.
---

# Refs & Escape Hatches

## useRef

```tsx
const ref = useRef<HTMLDivElement>(null)
```

`useRef` returns a **mutable object** whose `.current` property persists across renders.

- **Do not read or write `ref.current` during rendering** — it is not reactive, so changes will not trigger a re-render and the values may be stale. Read/write it in event handlers or effects.
- The initial value is only used on the first render.
- A ref is the right tool for values that are **not needed for rendering**: DOM nodes, timers, previous values, instances of third-party objects.

```tsx
const inputRef = useRef<HTMLInputElement>(null)

function focus() {
  inputRef.current?.focus()   // ✅ in an event handler
}
```

### Refs vs state

| | Ref | State |
|---|---|---|
| Mutable | yes | no (treat as immutable) |
| Triggers re-render | no | yes |
| Read during render | allowed (but discouraged) | yes |
| Use for | DOM nodes, timers, previous values | anything shown in the UI |

If changing the value must update the UI, it is **state**, not a ref.

## Escape hatches

When React cannot express what you need, reach for the DOM directly — but keep it minimal and isolated.

### Manipulating the DOM with refs

```tsx
function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  function play() {
    videoRef.current?.play()
  }
  return <video ref={videoRef} src={src} />
}
```

Typical uses: focus/scroll into view, play/pause media, measuring an element, integrating a third-party library.

### Integrating with third-party libraries

```tsx
useEffect(() => {
  const map = new maplibregl.Map({ container: containerRef.current! })
  return () => map.remove()
}, [])
```

Always clean up in the effect's cleanup function.

### `useImperativeHandle`

Expose a limited imperative API from a component to its parent:

```tsx
const inputRef = useRef<HTMLInputElement>(null)
useImperativeHandle(ref, () => ({
  focus: () => inputRef.current?.focus(),
  clear: () => { inputRef.current!.value = '' },
}), [])
```

The handle is recreated only when its dependency array changes.

## Keeping state in a ref vs resetting it

- To **reset** a component's state, change its `key`.
- To **reset** an uncontrolled DOM input, assign to the DOM node (`inputRef.current.value = ''`) — that is an escape hatch, not state.

## Common mistakes

- Writing `ref.current` during render → React may discard the write (render can be restarted).
- Using a ref as a substitute for state → the UI will not update.
- Forgetting to clean up an effect that registers a global listener.
- Assuming a ref's value is fresh inside a long-running async callback — use `useEffectEvent` if you need the latest props/state there.

<!--
Source references:
- https://react.dev/reference/react/useRef
- https://react.dev/learn/referencing-values-with-refs
- https://react.dev/learn/manipulating-the-dom-with-refs
- https://react.dev/learn/escape-hatches
- https://react.dev/reference/react/useImperativeHandle
-->
