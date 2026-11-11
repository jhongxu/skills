> Docs live in `sources/tanstack-form/docs/`:
> - `overview.md`, `philosophy.md`, `installation.md`, `typescript.md`, `comparison.md`
> - `framework/react/guides/` — basic-concepts, validation, submission-handling, reactivity, arrays, form-groups, linked-fields, form-composition, listeners, custom-errors, focus-management, ssr, debugging, devtools, ui-libraries
> - `framework/react/reference/` — the API reference
> Other frameworks (vue, solid, angular, svelte, lit, preact) have parallel docs — prefer the React ones.

- Prefer TypeScript over JavaScript.
- Build reusable, headless field components with `createFormHook` instead of repeating `form.Field` markup.
- Share form configuration through `formOptions`.
- Always subscribe with a **selector** — never read `form.state` directly during render.
- Use `onBlur` for expensive validators, `onChange` for cheap ones, `onSubmit` for cross-field rules.
- Prefer the Standard Schema interface so the validation library stays swappable.
- Parse the schema output inside `onSubmit` — the form submits the schema's *input* type.
