---
name: core-submission
description: TanStack Form v1 submission handling - onSubmit, handleSubmit, submission meta, submission state, and transforming data with Standard Schema.
---

# Submission

```tsx
const form = useForm({
  defaultValues: { email: '' },
  onSubmit: async ({ value }) => {
    await api.save(value)
  },
})
```

```tsx
<form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
  ...
</form>
```

Call `e.preventDefault()` and `e.stopPropagation()` — TanStack Form does not do it for you.

## Submission state

`form.Subscribe` gives you reactive access:

```tsx
<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
  {([canSubmit, isSubmitting]) => (
    <button type="submit" disabled={!canSubmit}>
      {isSubmitting ? 'Submitting…' : 'Submit'}
    </button>
  )}
</form.Subscribe>
```

- `isSubmitting` — a submission is in flight.
- `canSubmit` — no validation errors and not already submitting.
- `submissionAttempts` — how many times the user tried.

## onSubmitMeta

Pass extra data to `onSubmit` through `handleSubmit`:

```tsx
type FormMeta = { submitAction: 'continue' | 'backToMenu' | null }

const form = useForm({
  onSubmit: async ({ value, formMeta }) => {
    if (formMeta?.submitAction === 'backToMenu') return
    await api.save(value)
  },
})

form.handleSubmit({ submitAction: 'backToMenu' })
```

`handleSubmit()` without meta uses the default you provide.

## Transforming with Standard Schema

Form always submits the **input** data. To submit the schema's **output**, parse it yourself:

```tsx
const schema = z.object({ age: z.string().transform(Number) })

const form = useForm({
  defaultValues: { age: '' } as z.input<typeof schema>,
  onSubmit: async ({ value }) => {
    const parsed = schema.parse(value)   // { age: number }
    await api.save(parsed)
  },
})
```

## Async validation vs async submission

Validation runs **before** `onSubmit`; a failing validator prevents the submit. `onSubmit` itself may be async — the form stays in `isSubmitting` until it resolves. Errors thrown inside `onSubmit` are **not** caught by field validators; handle them explicitly (or set them with `form.setError`).

<!--
Source references:
- https://tanstack.com/form/latest/docs/framework/react/guides/submission-handling
- https://tanstack.com/form/latest/docs/framework/react/guides/validation
-->
