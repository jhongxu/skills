---
name: zod
description: Zod v4 - TypeScript-first schema validation with static type inference, covering primitives, objects, unions, refinements, error customization, string formats, codecs, JSON Schema and Zod Mini.
metadata:
  author: jianghongxu
  version: "2026.11.11"
  source: Generated from https://github.com/colinhacks/zod, scripts at https://github.com/jhongxu/skills
---

# Zod

> Based on Zod v4.6, generated at 2026-11-11. The `zod` package is v4 by default; `zod/v4` resolves to the same.

## Preferences

- Prefer TypeScript over JavaScript.
- Infer types with `z.infer` instead of writing them twice.
- Use `safeParse` at API boundaries and handle `error.issues` explicitly.
- Prefer `z.object()` + `z.strictObject()` deliberately — know whether unknown keys should be stripped or rejected.
- Use Standard Schema-compatible libraries so validators stay swappable.
- Use `z.stringFormat` for custom string formats instead of `.refine()` — the error code is more descriptive.
- Use `z.compile()` for schemas validated on hot paths.

## Core

| Topic | Description | Reference |
|-------|-------------|--------|
| Basics | Schemas, `parse`/`safeParse`, inference, primitives, coercion, literals, objects, arrays, records, enums | [core-basics](references/core-basics.md) |
| Composition & Refinement | Unions, discriminated unions, XOR, pipes, transforms, defaults/prefaults, brand, `refine`/`check`, error customization | [core-composition](references/core-composition.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|--------|
| Formats & Scalars | String formats (email/uuid/url/ISO/IP/JWT…), numbers, dates, template literals, stringbool, functions | [features-formats](references/features-formats.md) |
| Advanced | Codecs, JSON Schema, registries, AOT compilation, Zod Mini, `@zod/core` | [advanced](references/advanced.md) |

## Quick Reference

### Schema

```ts
import * as z from 'zod'

const User = z.object({
  email: z.email(),
  age: z.number().int().positive(),
  role: z.enum(['admin', 'user']),
})

type User = z.infer<typeof User>
```

### Parsing

```ts
const result = User.safeParse(data)
if (!result.success) {
  console.error(result.error.issues)   // [{ code, path, message }]
}
```

### Errors

```ts
z.string('Not a string!')
z.string({ error: 'Bad!' })
z.string().min(5, { error: 'Too short!' })
schema.parse(data, { error: (iss) => 'per-parse' })
z.config({ customError: (iss) => 'global' })
```

### Refinements

```ts
z.string().refine((s) => s.length > 8, { error: 'Too short!' })
z.string().superRefine((val, ctx) => { ctx.addIssue({ code: 'custom', message: '…' }) })
```

### Things that bite

- `z.record(key, value)` needs **both** schemas in v4.
- `z.object()` **strips** unknown keys; `z.strictObject()` errors on them.
- All object keys are **required** in v4 (v3 had them optional).
- `z.enum(arr)` needs the array inline or `as const`, otherwise the type widens to `string`.
- A **default** short-circuits parsing (output type); a **prefault** is parsed (input type).
- `.refine()`/`.check()` cannot change the inferred type.

## Errors reference

Issue codes: `invalid_type`, `invalid_format`, `invalid_value`, `too_small`, `too_big`, `unrecognized_keys`, `invalid_union`, `invalid_key`, `invalid_element`, `custom`.
