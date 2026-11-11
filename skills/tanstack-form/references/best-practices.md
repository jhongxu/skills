---
name: best-practices
description: TanStack Form v1 best practices - headless field components, form options, focus management, SSR, debugging and the library philosophy.
---

# Best Practices

## The philosophy

TanStack Form is built for **large-scale production usage** — type safety, performance and composition over short copy-paste snippets. It is **headless**: you own the markup and the styling.

Practical consequences:

- Build your own field components (`TextField`, `SelectField`, …) once, and reuse them. Use `createFormHook` / `createFormHookContexts` so the form options are baked in.
- Keep a shared `formOptions` per form type so defaults and validators stay consistent.
- Prefer `useAppForm` (from your own hook) over bare `useForm` in app code.

## Validation strategy

- Use `onBlur` for expensive or chatty checks (server lookups), `onChange` for cheap local ones, `onSubmit` for cross-field rules.
- Keep validators **pure and synchronous where possible**; async validators need `isValidating` handling in the UI.
- Return `undefined` for "valid" — a falsy value means no error.
- Use form-level validators for rules that span several fields.

## State

- Never read `form.state` directly in render — subscribe with `useSelector` or `form.Subscribe`.
- Always pass a **selector**; without one you re-render on every keystroke.
- Keep selector results primitive or stable.

## Focus management

After a failed submit, move focus to the first invalid field so keyboard and screen-reader users are not stranded. TanStack Form exposes `form.state.errorMap` / field meta to find it; pair with a ref to the first errored input.

## SSR

- Form state is client-side; on the server, render the fields with their default values.
- For async initial values, load them before rendering (route loader, server component) and pass them as `defaultValues` — do not fetch inside the form.
- Keep the form instance stable across renders; do not create it conditionally.

## Debugging

- Install the devtools — they show values, errors and validation triggers live.
- The `errorMap` (errors by trigger) tells you *when* an error was produced, which is usually the missing piece when a form "feels broken".
- Use `form.setError` for server-side errors that do not belong to one field.

## Common mistakes

- Forgetting `e.preventDefault()` in the `<form onSubmit>` handler.
- Mixing controlled and uncontrolled inputs.
- Using `field.state.value` in a parent component instead of subscribing.
- Creating the form inside a component that unmounts (loses all state).
- Validating only the field that changed when two fields are linked — use listeners.

<!--
Source references:
- https://tanstack.com/form/latest/docs/framework/react/overview
- https://tanstack.com/form/latest/docs/framework/react/philosophy
- https://tanstack.com/form/latest/docs/framework/react/guides/focus-management
- https://tanstack.com/form/latest/docs/framework/react/guides/ssr
- https://tanstack.com/form/latest/docs/framework/react/guides/debugging
- https://tanstack.com/form/latest/docs/framework/react/guides/ui-libraries
-->
