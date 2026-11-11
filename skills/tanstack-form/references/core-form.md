---
name: core-form
description: TanStack Form v1 core API - useForm, formOptions, the form instance, form.Field, field state and field methods.
---

# The Form

A **headless**, type-first form library: no UI, you render the inputs.

```tsx
import { useForm } from '@tanstack/react-form'

const form = useForm({
  defaultValues: { firstName: '', lastName: '', hobbies: [] },
  onSubmit: async ({ value }) => {
    console.log(value)
  },
})
```

## formOptions

Share configuration between forms:

```tsx
import { formOptions } from '@tanstack/react-form'

const userFormOpts = formOptions({
  defaultValues: { firstName: '', lastName: '' },
})

const form = useForm({
  ...userFormOpts,
  onSubmit: async ({ value }) => { /* ... */ },
})
```

## Fields

```tsx
<form.Field
  name="firstName"
  children={(field) => (
    <input
      value={field.state.value}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
    />
  )}
/>
```

`name` must match a key in `defaultValues`. For nested values use dot paths (`'user.name'`) or bracket paths (`'people[0].name'`).

### Field state

| Property | Meaning |
|---|---|
| `field.state.value` | current value |
| `field.state.meta.errors` | array of errors from the last validation pass |
| `field.state.meta.errorMap` | errors keyed by when they occurred (`onChange`, `onBlur`, `onSubmit`, `onMount`) |
| `field.state.meta.isTouched` | the field has been blurred |
| `field.state.meta.isDirty` | the value differs from the default |
| `field.state.meta.isValid` | no errors |
| `field.state.meta.isValidating` | an async validator is running |

### Field methods

`field.handleChange(value)`, `field.handleBlur()`, `field.setError(...)`, `field.reset()`.

## Form instance

```tsx
form.handleSubmit()                 // submit
form.setFieldValue('name', value)   // set one field
form.setValues({ ... })             // merge values
form.reset()                        // back to defaultValues
form.setError(...)                  // form-level error
form.state.values                   // current values (not reactive — see reactivity guide)
```

## Rendering

Wrap the fields in a `<form>` and give the submit button the form's `handleSubmit`:

```tsx
<form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
  <form.Field name="email">{(field) => <input {...field} />}</form.Field>
  <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
    {([canSubmit, isSubmitting]) => (
      <button type="submit" disabled={!canSubmit}>
        {isSubmitting ? 'Submitting…' : 'Submit'}
      </button>
    )}
  </form.Subscribe>
</form>
```

<!--
Source references:
- https://tanstack.com/form/latest/docs/framework/react/overview
- https://tanstack.com/form/latest/docs/framework/react/quick-start
- https://tanstack.com/form/latest/docs/framework/react/guides/basic-concepts
-->
