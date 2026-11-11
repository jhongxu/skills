---
name: core-composition
description: Zod v4 composition and refinement - unions, discriminated unions, XOR, intersections, pipes, transforms, defaults, prefaults, catch, brand, refine, check and error customization.
---

# Composition & Refinement

## Unions

```ts
z.union([z.string(), z.number()])          // first match wins
z.discriminatedUnion('status', [           // fast, narrowed by a key
  z.object({ status: z.literal('ok'), data: z.string() }),
  z.object({ status: z.literal('err'), error: z.string() }),
])
z.xor([z.string(), z.number()])            // exactly one must match
```

`z.xor()` fails when **zero or multiple** options match — handy for mutually exclusive payloads. Because `z.object()` strips unknown keys, branches often overlap; use `z.strictObject()` on the narrower branch to make them exclusive.

## Intersections

```ts
z.intersection(z.object({ a: z.string() }), z.object({ b: z.number() }))
```

## Pipes and transforms

```ts
z.string().pipe(z.transform((v) => v.length))     // "hello" → 5
z.string().transform((v) => v.length)
z.preprocess((v) => Number(v), z.number())        // unknown → number
```

`z.pipe(a, b)` runs `a` then `b`; in Zod Mini the equivalent is `z.pipe(z.string(), z.transform(...))`.

## Defaults vs prefaults

```ts
z.string().default('tuna')      // output type; parse(undefined) → 'tuna' (short-circuits)
z.string().prefault('tuna')     // input type;  parse(undefined) → parses 'tuna'
```

- A **default** short-circuits parsing — the value must be assignable to the schema's **output** type.
- A **prefault** is parsed — the value must be assignable to the **input** type. Use it when the default needs to pass through the schema.

## Catch

```ts
z.number().catch(0)   // never fails; falls back to 0
```

## Branded types & readonly

```ts
const UserId = z.string().brand<'UserId'>()
type UserId = z.infer<typeof UserId>      // string & { brand: 'UserId' }
z.object({ id: UserId }).readonly()
```

## Refinements

```ts
z.string().min(5).refine((s) => s.startsWith('a'), 'Must start with a')
z.string().superRefine((val, ctx) => {
  if (!val.includes('x')) ctx.addIssue({ code: 'custom', message: 'needs x' })
})
```

- `.refine()` adds a check; `.superRefine()` gives you the `ctx` to add several issues.
- **`.check()`** (v4) is the newer primitive for custom checks — and like all checks, it **cannot change the inferred type**.

## Error customization

```ts
z.string('Not a string!')                    // string message as 2nd arg
z.string({ error: 'Bad!' })                  // params object
z.string().min(5, { error: 'Too short!' })
z.string({ error: (iss) => `bad ${iss.input}` })   // error map function
```

Per-parse and global:

```ts
schema.parse(data, { error: (iss) => 'per-parse custom error' })

z.config({
  customError: (iss) => 'global message',
})
```

**Precedence**: per-parse > schema-level > global.

The `error` map runs **at parse time**, so a schema defined once picks up the current language on every parse — ideal for i18n. To translate at render time, translate the issue itself (`issue.code` is the key, the other properties are the interpolation values).

## Errors

`safeParse` returns a `ZodError` with an `.issues` array; each issue has a `message`, a `path` and a `code` (`invalid_type`, `invalid_format`, `too_small`, `too_big`, `invalid_value`, `unrecognized_keys`, `invalid_union`, `invalid_key`, `invalid_element`, `custom`).

<!--
Source references:
- https://zod.dev/api
- https://zod.dev/error-customization
- https://zod.dev/error-formatting
-->
