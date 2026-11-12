> The Drizzle docs website content is **not** in the public repo — `docs/` only holds
> `joins.md`, `custom-types.md`, `custom-types.lite.md` and `table-introspect-api.md`.
> The API truth in this repo comes from:
> - `drizzle-orm/src/**` — the implementation; `pg-core/`, `mysql-core/`, `sqlite-core/`,
>   `sql/query-builders/`, `relations.ts`, `alias.ts`, `subquery.ts`, `migrator.ts`, `errors.ts`
> - `drizzle-orm/type-tests/**` — type-level usage examples
> - `drizzle-kit/src/cli/commands/**` + `drizzle-kit/src/cli/validations/common.ts` — the CLI commands
> - `drizzle-zod/src/schema.ts`, `drizzle-valibot/`, `drizzle-arktype/`, `drizzle-typebox/`, `drizzle-seed/`
> - `changelogs/drizzle-orm/*.md` — 140 files documenting API evolution (read the latest few for version-specific behaviour)
> - `docs/joins.md`, `docs/custom-types.md` — the prose docs that do exist
>
> Note: `drizzle-kit/README.md` shows the **legacy object** form for a table's extra config —
> the current API returns an array. Verify against `src/pg-core/table.ts` before trusting the README.

- Prefer TypeScript over JavaScript.
- Keep the schema in one module and let Drizzle Kit diff it against the snapshot.
- Use `generate` + `migrate` in production; `push` only in development.
- Always use the `sql` template tag for raw SQL — never concatenate strings.
- Prefer the relational builder for nested reads, explicit joins for flat shapes.
- Select only the columns you need; batch bulk writes.
