---
name: core-basics
description: Zod v4 basics - defining schemas, parse and safeParse, type inference, primitives, coercion, literals, optionals, objects, arrays, records and enums.
---

# Basics

Zod is a **TypeScript-first schema validation** library: define a schema once, get both runtime validation and static types from it.

```ts
import * as z from 'zod'

const Player = z.object({
  username: z.string(),
  xp: z.number(),
})

type Player = z.infer<typeof Player>
```

The `zod` package is now **v4** by default (`zod/v4` also resolves to it; `zod/v3` keeps the old API).

## Parsing

```ts
Player.parse({ username: 'billie', xp: 100 })      // throws on failure
const result = Player.safeParse(data)               // { success: true, data } | { success: false, error }
```

- `.parse()` returns a **deep clone** of the input.
- `.parseAsync()` / `.safeParseAsync()` for async refinements.
- `z.decode(schema, input)` — like `parse` but with a **typed** input (not `unknown`).

## Primitives

```ts
z.string()  z.number()  z.bigint()  z.boolean()  z.symbol()  z.undefined()  z.null()  z.void()
z.any()     z.unknown() z.never()
```

### Coercion

```ts
z.coerce.string()   // input: unknown → output: string
z.coerce.number()
z.coerce.boolean()
z.coerce.date()
```

Coercion accepts anything the runtime can convert — useful for query strings and env vars.

## Literals and enums

```ts
z.literal('hello')
z.enum(['Salmon', 'Tuna', 'Trot'])        // pass the array directly!
z.enum({ Salmon: 0, Tuna: 1 })
```

⚠️ If you pass an enum array through a variable, Zod cannot infer the exact values — use `as const` or inline the array:

```ts
const fish = ['Salmon', 'Tuna'] as const
const FishEnum = z.enum(fish)     // ✅ "Salmon" | "Tuna"
```

Native TypeScript enums are supported too.

## Optional / nullable / nullish

```ts
z.string().optional()   // string | undefined
z.string().nullable()   // string | null
z.string().nullish()    // string | null | undefined
```

## Objects

```ts
const Person = z.object({
  name: z.string(),
  age: z.number().optional(),
})
```

- **All keys are required by default** in Zod v4 (in v3 they were optional).
- Unknown keys are **stripped** by default.

Variants:

```ts
z.strictObject({ name: z.string() })   // unknown keys → error
z.looseObject({ name: z.string() })    // unknown keys → passed through
```

Methods: `.extend()`, `.safeExtend()`, `.pick()`, `.omit()`, `.partial()`, `.required()`, `.shape`, `.keyof()`, `.catchall()`.

## Arrays and tuples

```ts
z.array(z.string())
z.array(z.string()).min(1).max(10)
z.tuple([z.string(), z.number()])       // fixed length
z.tuple([z.string(), z.number()], z.void())  // rest elements
```

## Records

```ts
z.record(z.string(), z.string())        // Record<string, string>
```

⚠️ **In v4 `z.record()` takes both a key and a value schema.** The key schema may be any schema assignable to `string | number | symbol`:

```ts
z.record(z.enum(['id', 'name']), z.string())   // { id: string; name: string }
```

Variants: `z.partialRecord()`, `z.looseRecord()`.

## Maps, sets, files, promises

```ts
z.map(z.string(), z.number())
z.set(z.string())
z.file()          // File / Blob
z.promise(z.string())
z.instanceof(MyClass)
```

<!--
Source references:
- https://zod.dev/basics
- https://zod.dev/api
- https://zod.dev/packages/zod
-->
