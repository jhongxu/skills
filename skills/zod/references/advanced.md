---
name: advanced
description: Zod v4 advanced features - codecs for bidirectional transforms, JSON Schema conversion, registries and metadata, AOT compilation, Zod Mini and the @zod/core package.
---

# Advanced

## Codecs

A codec is a schema with a **bidirectional** transformation between two schemas:

```ts
const stringToDate = z.codec(
  z.iso.datetime(),   // input schema
  z.date(),           // output schema
  {
    decode: (isoString) => new Date(isoString),   // input → output
    encode: (date) => date.toISOString(),         // output → input
  },
)

stringToDate.parse('2024-01-15T10:30:00.000Z')   // → Date
z.decode(stringToDate, '2024-01-15T10:30:00.000Z') // → Date (typed input)
z.encode(stringToDate, new Date())                 // → '2024-01-15T00:00:00.000Z'
```

- `z.invertCodec()` swaps input and output.
- Introduced in `zod@4.1`.

## JSON Schema

```ts
z.toJSONSchema(schema)     // native JSON Schema output
```

- Great for OpenAPI definitions and **AI structured outputs**.
- `z.fromJSONSchema()` exists but is **experimental** — not part of the stable API.

## Registries & metadata

Attach metadata to schemas for documentation, codegen, AI structured outputs and form validation:

```ts
const myRegistry = z.registry<{ description: string }>()

myRegistry.add(schema, { description: 'A cool schema!' })
myRegistry.get(schema)
myRegistry.has(schema)
myRegistry.remove(schema)
```

TypeScript enforces that the metadata matches the registry's type. ⚠️ The `id` property is special — registering two schemas with the same `id` throws.

## AOT compilation

`z.compile()` compiles a schema ahead of time into a flat, loop-free validator — **~9x faster** for objects and tuples:

```ts
const CompiledPlayer = z.compile(Player)

CompiledPlayer.parse({ ... })   // same results and errors
```

A compiled schema is a normal Zod schema: same methods, same inferred types, same issues.

## The three packages

| Package | Use |
|---|---|
| `zod` | flagship — best DX, sensible bundle size (most apps) |
| `zod/mini` | tree-shakable, **functional** API for strict bundle budgets |
| `zod/v4/core` | the shared internals — the base classes everything extends |

Zod Mini has a functional API — top-level functions instead of methods:

```ts
import * as z from 'zod/mini'

z.optional(z.string())
z.array(z.string())
z._default(z.string(), 'tuna')
z.parse(schema, data)
```

## Library authors

If you are writing a library that ships Zod schemas:

- Export the **schema**, not the parsed type, so consumers can re-validate.
- Use `z.infer` to expose the type.
- Consider `zod/mini` for a smaller dependency.
- Use `z.toJSONSchema()` if the library also generates OpenAPI.

<!--
Source references:
- https://zod.dev/codecs
- https://zod.dev/json-schema
- https://zod.dev/metadata
- https://zod.dev/compile
- https://zod.dev/packages/mini
- https://zod.dev/packages/core
- https://zod.dev/library-authors
-->
