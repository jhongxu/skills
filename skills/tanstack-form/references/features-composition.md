---
name: features-composition
description: TanStack Form v1 composition - form groups for multi-step forms, linked fields, array fields, and createFormHook for reusable field components.
---

# Composition

## Form groups

For multi-step forms, `<form.FormGroup>` gives each step its own sub-form while keeping one submission and validation flow:

```tsx
const form = useForm({
  defaultValues: {
    step1: { name: '' },
    step2: { address: '' },
  },
  onSubmit: async ({ value }) => { /* ... */ },
})

const [step, setStep] = useState(0)

<form.FormGroup>
  {() => (
    <>
      {step === 0 && <StepOne />}
      {step === 1 && <StepTwo />}
    </>
  )}
</form.FormGroup>
```

Combine with external state to render one step at a time. Group validation works like field validation.

## Linked fields

Two fields that depend on each other (password / confirm password):

```tsx
<form.Field
  name="confirmPassword"
  validators={{
    onChange: ({ value }) =>
      value !== form.getFieldValue('password') ? 'Passwords do not match' : undefined,
  }}
>
```

⚠️ Validating only on the changed field leaves the other stale. Use the **listeners** API to re-run the dependent field's validation when its source changes.

## Arrays

```tsx
const form = useForm({
  defaultValues: { people: [] as { name: string; age: number }[] },
})

<form.Field name="people">
  {(field) => (
    <>
      {field.state.value.map((person, i) => (
        <form.Field key={i} name={`people[${i}].name`}>
          {(subField) => (
            <input
              value={subField.state.value}
              onChange={(e) => subField.handleChange(e.target.value)}
            />
          )}
        </form.Field>
      ))}
      <button type="button" onClick={() => field.pushValue({ name: '', age: 0 })}>
        Add person
      </button>
    </>
  )}
</form.Field>
```

Array helpers on the field: `pushValue`, `insertValue`, `removeValue`, `swapValues`, `move`… The JSX is regenerated on every `pushValue`.

## Reusable field components

`createFormHook` builds a typed hook + component pair so a field is written once and reused everywhere:

```tsx
export const { useAppForm, TextField, SubmitButton } = createFormHookContexts({
  defaultValues: { firstName: '' },
})
```

- `useAppForm` — like `useForm` but with the shared options baked in.
- `TextField` — a pre-bound component; consumers do not repeat `form.Field`.
- All `useForm` properties work in `useAppForm`; all `form.Field` properties work in `form.AppField`.

This is the recommended way to build a UI component library on top of TanStack Form.

<!--
Source references:
- https://tanstack.com/form/latest/docs/framework/react/guides/form-groups
- https://tanstack.com/form/latest/docs/framework/react/guides/linked-fields
- https://tanstack.com/form/latest/docs/framework/react/guides/arrays
- https://tanstack.com/form/latest/docs/framework/react/guides/form-composition
-->
