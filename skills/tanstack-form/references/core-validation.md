---
name: core-validation
description: TanStack Form v1 validation - onChange/onBlur/onSubmit validators, async validators, Standard Schema support, custom error values and form-level validation.
---

# Validation

Validation lives on the **field** (`validators`) or on the **form** (`validators` in `useForm`).

## Field validators

```tsx
<form.Field
  name="age"
  validators={{
    onChange: ({ value }) => (value < 13 ? 'You must be 13 to make an account' : undefined),
    onBlur: ({ value }) => (value < 0 ? 'Invalid value' : undefined),
    onSubmit: ({ value }) => (value > 150 ? 'Too old' : undefined),
  }}
>
  {(field) => <input value={field.state.value} onChange={e => field.handleChange(e.target.value)} />}
/>
```

- `onChange`, `onBlur`, `onSubmit`, `onMount` — run at that moment.
- Multiple validators can run at different times; `field.state.meta.errors` holds all current errors, `errorMap` groups them by trigger.
- Return `undefined` (or any falsy value) for "no error".

## Async validators

```tsx
validators={{
  onBlur: async ({ value }) => {
    const exists = await api.usernameTaken(value)
    return exists ? 'Username already taken' : undefined
  },
}}
```

While an async validator runs, `field.state.meta.isValidating` is `true`.

## Form-level validation

```tsx
const form = useForm({
  defaultValues: { username: '', email: '' },
  validators: {
    onSubmit: ({ value }) => {
      const errors = {}
      if (!value.username) errors.username = 'Required'
      return Object.keys(errors).length ? errors : undefined
    },
  },
  onSubmit: async ({ value }) => { /* ... */ },
})
```

## Custom error values

Validators may return **any** value — a truthy value is an error, falsy means valid:

```tsx
validators={{ onChange: ({ value }) => (value < 18 ? 18 - value : undefined) }}
```

Numbers are handy ("you need N more years"). The type is inferred, so the UI knows what it got.

## Standard Schema

TanStack Form supports **Standard Schema** (Zod, Valibot, ArkType, …):

```tsx
const schema = z.object({ username: z.string().min(3) })

<form.Field
  name="username"
  validators={{ onChange: ({ value }) => schema.shape.username.safeParse(value).error?.issues[0].message }}
>
```

- Form uses the **input** type of the schema for `defaultValues`.
- The **output** type is not preserved — parse in `onSubmit` if you need it.

## Displaying errors

```tsx
{field.state.meta.errors.map((error, i) => (
  <div key={i} className="error">{error}</div>
))}
```

Or use `errorMap` to show only the error for a specific trigger (e.g. show the `onSubmit` error at the top of the form and the `onChange` error inline).

<!--
Source references:
- https://tanstack.com/form/latest/docs/framework/react/guides/validation
- https://tanstack.com/form/latest/docs/framework/react/guides/custom-errors
- https://tanstack.com/form/latest/docs/framework/react/guides/dynamic-validation
-->
