---
name: features-reactive
description: TanStack Form v1 reactivity - useSelector, form.Subscribe, listeners for side effects, and the form devtools.
---

# Reactivity & Side Effects

## The problem

**TanStack Form does not cause re-renders** when the form changes. Reading `form.state.values` directly gives you a stale snapshot.

## Subscribing

### useSelector

```tsx
import { useSelector } from '@tanstack/react-form'

const firstName = useSelector(form.store, (state) => state.values.firstName)
const errors = useSelector(form.store, (state) => state.errorMap)
```

- ⚠️ Always pass a selector — omitting it re-renders on **every** state change.
- A selector returning a new object re-renders every time; return primitives or compare.
- `useStore` still exists but is **deprecated** — use `useSelector` (same arguments, or `{ compare }` as the third).

### form.Subscribe

```tsx
<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
  {([canSubmit, isSubmitting]) => <button disabled={!canSubmit}>Submit</button>}
</form.Subscribe>
```

Use it for anything rendered inside the form. Select the **smallest** slice you need.

## Listeners (side effects on triggers)

For "react to a trigger" logic — e.g. reset the province when the country changes:

```tsx
<form.Field
  name="country"
  listeners={{
    onChange: ({ value }) => {
      form.setFieldValue('province', '')
    },
  }}
>
```

Events that can be listened to: `onChange` (and more, depending on version).

## Devtools

```sh
npm i @tanstack/react-devtools @tanstack/react-form-devtools
```

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import { formDevtoolsPlugin } from '@tanstack/react-form-devtools'

<TanStackDevtools plugins={[formDevtoolsPlugin()]} />
```

Shows the form state, field values, errors and validation runs live.

<!--
Source references:
- https://tanstack.com/form/latest/docs/framework/react/guides/reactivity
- https://tanstack.com/form/latest/docs/framework/react/guides/listeners
- https://tanstack.com/form/latest/docs/framework/react/guides/devtools
-->
