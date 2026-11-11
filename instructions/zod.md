> Docs live in `sources/zod/packages/docs/content/`:
> - `basics.mdx` — the curated introduction (define → parse → infer → handle errors)
> - `api.mdx` — the full API reference (3600 lines; read the section you need)
> - `error-customization.mdx`, `error-formatting.mdx` — error messages, maps, precedence, i18n
> - `json-schema.mdx`, `codecs.mdx`, `compile.mdx`, `metadata.mdx`, `ecosystem.mdx`, `library-authors.mdx`
> - `packages/zod.mdx`, `packages/mini.mdx`, `packages/core.mdx` — the three packages
> - `v4/` — the v4 changelog and versioning policy
> Note: the repo root also has `packages/*/README.md`; `packages/docs/content` is the canonical doc source.

- Prefer TypeScript over JavaScript.
- Infer types with `z.infer` instead of writing them twice.
- Use `safeParse` at API boundaries and handle `error.issues` explicitly.
- Prefer `z.object()` vs `z.strictObject()` deliberately — know whether unknown keys should be stripped or rejected.
- Use `z.stringFormat` for custom string formats instead of `.refine()` — the error code is more descriptive.
- Use `z.compile()` for schemas validated on hot paths.
