---
name: features-formats
description: Zod v4 string formats and scalar types - email, uuid, url, ISO dates, IPs, credit cards, JWT, custom stringFormat, numbers, ints, bigints, dates, template literals and stringbool.
---

# Formats & Scalars

## String formats

In v4 the common formats are **top-level functions** rather than methods:

```ts
z.email()          z.uuid()           z.url()            z.hostname()
z.iso.datetime()   z.iso.date()       z.iso.time()       z.iso.duration()
z.ipv4()           z.ipv6()           z.cidrv4()         z.cidrv6()
z.mac()            z.creditCard()     z.currency()       z.iban()
z.jwt()            z.hash()           z.e164()           z.nanoid()
z.cuid()           z.cuid2()          z.ulid()           z.base64()
z.base64url()      z.hex()            z.jwt()            z.e164()
```

### Custom formats

```ts
const coolId = z.stringFormat('cool-id', (val) => val.length === 100 && val.startsWith('cool-'))
// a regex works too
z.stringFormat('cool-id', /^cool-[a-z0-9]{95}$/)
```

Custom formats produce a **more descriptive** issue code (`invalid_format` with the format name) than the generic `custom` error from a refinement.

## Numbers

```ts
z.number()                       // any finite number
z.number().int()                 // integer
z.number().min(0).max(100)       // range
z.number().positive()            // > 0
z.number().multipleOf(5)
z.int()                          // v4 shorthand for an integer
z.int32()  z.int64()             // bounded ints
z.float32()                      // 32-bit float
z.bigint()                       // bigint
```

## Dates

```ts
z.date()                 // a Date instance
z.coerce.date()          // from a string/number
```

## Template literals

```ts
z.templateLiteral(['hello ', z.string()])   // "hello world"
```

## Stringbool

Parses "boolish" strings — handy for environment variables:

```ts
z.stringbool().parse('yes')    // true
z.stringbool().parse('off')    // false

z.stringbool({
  truthy: ['true', '1', 'yes', 'on', 'y', 'enabled'],
  falsy: ['false', '0', 'no', 'off', 'n', 'disabled'],
})
```

## Functions

```ts
const fn = z.function({
  input: [z.string()],
  output: z.number(),
})
```

Zod validates the function's **arguments on call** and its return value.

## Recursive types

```ts
const Category = z.object({
  name: z.string(),
  get children() {
    return z.array(Category)
  },
})
```

## Instanceof and custom

```ts
z.instanceof(MyClass)
z.custom<MyType>((val) => val instanceof MyType)
```

<!--
Source references:
- https://zod.dev/api
- https://zod.dev/basics
-->
