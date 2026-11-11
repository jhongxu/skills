---
name: tanstack-form
description: TanStack Form v1 - headless, type-first form state management for React with field-level validation, Standard Schema support, form groups, array fields, reusable field components and a subscription-based reactivity model.
metadata:
  author: jianghongxu
  version: "2026.11.11"
  source: Generated from https://github.com/TanStack/form, scripts at https://github.com/jhongxu/skills
---

# TanStack Form

> Based on TanStack Form v1.33, generated at 2026-11-11. React (also Vue, Solid, Angular, Svelte, Lit, Preact).

## Preferences

- Prefer TypeScript over JavaScript.
- Build reusable, headless field components with `createFormHook` instead of repeating `form.Field` markup.
- Share form configuration through `formOptions` so defaults and validators stay consistent.
- Always subscribe with a **selector** (`useSelector` / `form.Subscribe`) — never read `form.state` directly during render.
- Use `onBlur` for expensive validators, `onChange` for cheap ones, `onSubmit` for cross-field rules.
- Prefer the **Standard Schema** interface so the validation library stays swappable (Zod, Valibot, ArkType).
- Parse the schema output inside `onSubmit` — the form submits the schema's *input* type.

## Core

| Topic | Description | Reference |
|-------|-------------|--------|
| The Form | `useForm`, `formOptions`, form instance, `form.Field`, field state and methods | [core-form](references/core-form.md) |
| Validation | `onChange`/`onBlur`/`onSubmit` validators, async validators, Standard Schema, custom error values | [core-validation](references/core-validation.md) |
| Submission | `onSubmit`, `handleSubmit`, `onSubmitMeta`, submission state, transforming data | [core-submission](references/core-submission.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|--------|
| Composition | Form groups for multi-step forms, linked fields, array fields, `createFormHook` | [features-composition](references/features-composition.md) |
| Reactivity & Side Effects | `useSelector`, `form.Subscribe`, listeners, form devtools | [features-reactive](references/features-reactive.md) |

## Best Practices

| Topic | Description | Reference |
|-------|-------------|--------|
| Habits | Field components, validation strategy, focus management, SSR, debugging | [best-practices](references/best-practices.md) |

## Quick Reference

### Form

```tsx
const form = useForm({
  defaultValues: { email: '' },
  onSubmit: async ({ value }) => api.save(value),
})

<form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
  <form.Field
    name="email"
    validators={{ onBlur: ({ value }) => (value.includes('@') ? undefined : 'Invalid email') }}
  >
    {(field) => (
      <input value={field.state.value} onBlur={field.handleBlur}
             onChange={(e) => field.handleChange(e.target.value)} />
    )}
  </form.Field>
</form>
```

### Subscribing

```tsx
const canSubmit = useSelector(form.store, (s) => s.canSubmit)
<form.Subscribe selector={(s) => s.isSubmitting}>{(v) => v && <Spinner />}</form.Subscribe>
```

### Things that bite

- The form does **not** re-render on its own — subscribe with a selector.
- `handleSubmit()` needs `e.preventDefault()` in the `<form>` handler.
- `useStore` is deprecated → use `useSelector`.
- Field validators return `undefined` for valid; the error type may be any value.
- Standard Schema output is not submitted automatically — parse in `onSubmit`.
