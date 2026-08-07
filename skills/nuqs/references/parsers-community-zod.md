# Zod codecs 适配器（社区）

> 面向 `nuqs@^2`。要求 `zod@^4.1` 的 `z.codec` 双向编解码能力。Zod 基础见 [../../data-and-forms/references/zod.md](../../data-and-forms/references/zod.md)。Custom parser 基础见 [core.md](core.md)。

Since `zod@^4.1`，你可以用 `z.codec` 给 schema 加双向序列化与反序列化，然后封装成 nuqs 的 `createParser`。

## 1. 适配器工厂

```ts
import { createParser } from 'nuqs/server'
import { z } from 'zod'

function createZodCodecParser<
  Input extends z.ZodCoercedString<string> | z.ZodPipe<any, any>,
  Output extends z.ZodType,
>(
  codec: z.ZodCodec<Input, Output> | z.ZodPipe<Input, Output>,
  eq: (a: z.output<Output>, b: z.output<Output>) => boolean = (a, b) => a === b,
) {
  return createParser<z.output<Output>>({
    parse(query) {
      return codec.parse(query)
    },
    serialize(value) {
      return codec.encode(value)
    },
    eq,
  })
}
```

## 2. 编解码组件：JSON + UTF-8 + base64url

要把任意对象安全地塞进 URL query，一条链路是：对象 ⇌ JSON 字符串 ⇌ UTF-8 bytes ⇌ base64url 字符串。用 codecs 分段实现，再用 `.pipe()` 组合：

```ts
// JSON codec
const jsonCodec = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString)
      } catch (err: any) {
        ctx.issues.push({
          code: 'invalid_format',
          format: 'json',
          input: jsonString,
          message: err.message,
        })
        return z.NEVER
      }
    },
    encode: value => JSON.stringify(value),
  })

// bytes ⇌ base64url
const base64urlToBytes = z.codec(z.base64url(), z.instanceof(Uint8Array), {
  decode: s => z.util.base64urlToUint8Array(s),
  encode: b => z.util.uint8ArrayToBase64url(b),
})

// string ⇌ UTF-8 bytes + 反向
const utf8ToBytes = z.codec(z.string(), z.instanceof(Uint8Array), {
  decode: str => new TextEncoder().encode(str),
  encode: bytes => new TextDecoder().decode(bytes),
})

function invertCodec<A extends z.ZodType, B extends z.ZodType>(
  codec: z.ZodCodec<A, B>,
): z.ZodCodec<B, A> {
  return z.codec<B, A>(codec.out, codec.in, {
    decode(value, ctx) {
      try {
        return codec.encode(value)
      } catch (err) {
        ctx.issues.push({
          code: 'invalid_format',
          format: 'invert.decode',
          input: String(value),
          message: err instanceof z.ZodError ? err.message : String(err),
        })
        return z.NEVER
      }
    },
    encode(value, ctx) {
      try {
        return codec.decode(value)
      } catch (err) {
        ctx.issues.push({
          code: 'invalid_format',
          format: 'invert.encode',
          input: String(value),
          message: err instanceof z.ZodError ? err.message : String(err),
        })
        return z.NEVER
      }
    },
  })
}

const bytesToUtf8 = invertCodec(utf8ToBytes)
```

## 3. 实际业务 schema + 合成 codec

```ts
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
})

// 组合：base64url bytes → UTF-8 bytes → UTF-8 string → JSON → user
const codec = base64urlToBytes.pipe(bytesToUtf8).pipe(jsonCodec(userSchema))

export const userJsonBase64Parser = createZodCodecParser(codec, (a, b) =>
  a === b || (a.name === b.name && a.age === b.age),
)
```

```tsx
const [user, setUser] = useQueryState('u', userJsonBase64Parser)
setUser({ name: 'Jane', age: 23 })
// URL 形如 ?u=eyJuYW1lIjoiSmFuZSIsImFnZSI6MjN9
```

## 4. 简单 codec 示例：date ⇌ timestamp 字符串

```ts
const dateTimestampCodec = z.codec(
  z.string().regex(/^\d+$/),
  z.date(),
  {
    decode: query => new Date(parseInt(query, 10)),
    encode: date => date.valueOf().toFixed(),
  },
)
const dateParser = createZodCodecParser(
  dateTimestampCodec,
  (a, b) => a.getTime() === b.getTime(),
)
```

## 5. Refinements：在输入端加字符串约束

codec 的**第一个类型参数**必须根植为 string（URL 输入始终是 string），你可以在这一头加 refinement：

```ts
z.codec(z.uuid(), ...)              // 输入端必须是 UUID 格式
z.codec(z.email(), ...)             // 输入端必须是邮箱
z.codec(z.base64url(), ...)         // 输入端必须是 base64url
```

完整列表见 [Zod String Formats](https://zod.dev/api?id=string-formats)。

## 6. Caveats

- Zod 文档明确：**codec 里不能用 transform**。如果需要 transform，放在 `pipe` 里在 codec 之后做（或反向前置）。
- URL 长度硬限（见 [core.md](core.md) 的限制）：base64url + JSON 是安全但膨胀率 ~1.33×，对象大了注意。
- 自定义 `eq`：parser 返回是对象时，必须提供，否则 `clearOnDefault` 行为错乱。

## 7. 速查

| 需求 | 做法 |
|------|------|
| 复用 Zod schema 做 URL 反序列化 | `createZodCodecParser(z.codec(input, output, { decode, encode }))` |
| 对象 → URL 安全字符串 | `base64urlToBytes.pipe(bytesToUtf8).pipe(jsonCodec(schema))` |
| 输入端做格式约束 | `z.codec(z.uuid()/z.email()/z.base64url(), outputType, …)` |
| codec 互换方向 | 自定义 `invertCodec` helper |
