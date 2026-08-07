# Effect Schema 适配器（社区）

> 面向 `nuqs@^2` + Effect 生态的 `Schema`。Effect Schema 自带双向编解码，天然匹配 nuqs parser 的 parse ↔ serialize 对称约束。custom parser 基础见 [core.md](core.md)。

## 1. 适配器工厂

```ts
import { createParser } from 'nuqs'
import { Schema, Either, Equal } from 'effect'

function createSchemaParser<T, E extends string>(schema: Schema.Schema<T, E>) {
  const encoder = Schema.encodeUnknownEither(schema)
  const decoder = Schema.decodeUnknownEither(schema)
  return createParser({
    parse: queryValue => {
      const result = decoder(queryValue)
      return Either.getOrNull(result)  // 失败 → null（回退默认值）
    },
    serialize: value => {
      const result = encoder(value)
      return Either.getOrThrowWith(
        result,
        cause => new Error(`Failed to encode value: ${String(value)}`, { cause }),
      )
    },
    eq: (a, b) => Equal.equals(a, b),  // 比 === 更泛化，处理 Effect 的 class/struct
  })
}
```

失败策略：`parse` 侧用 `Either.getOrNull` → URL 值非法时 nuqs 回退默认值（与内置 parser 行为一致）；`serialize` 侧用 `getOrThrowWith` → 应用端传了无法编码的值会抛错，开发期尽早暴露。

## 2. 示例：base64url 编码的 JSON → User 对象

```ts
import { Schema } from 'effect'

// 1. 业务 schema（类，结构清晰，默认值、类型校验都带）
class User extends Schema.Class<User>('User')({
  name: Schema.String,
  age: Schema.Positive,  // 正整数，序列化/反序列化时自动校验
}) {}

// 2. 编解码器：base64url string ⇌ JSON 字符串 ⇌ 对象
const ToBase64UrlEncodedJson = Schema.compose(
  Schema.StringFromBase64Url,
  Schema.parseJson(),
)
const schema = Schema.compose(ToBase64UrlEncodedJson, User)

// 3. 装配成 nuqs parser，业务类型自动推导
const parser = createSchemaParser(schema).withDefault(
  new User({ name: 'John Vim', age: 25 }),
)

// 4. 与普通 parser 一样用
const [user, setUser] = useQueryState('user', parser)

setUser(new User({ name: 'Jane', age: 23 }))
// URL 形如 ?user=eyJuYW1lIjoiSmFuZSIsImFnZSI6MjN9
```

Effect Schema 的 `Schema.Positive` 同时作用于 decode 与 encode，保证运行时修改 state 时也能被约束，不把非法值写进 URL。

## 3. 简单 codec 示例：date ⇌ ISO 字符串

```ts
import { Schema } from 'effect'

const dateParser = createSchemaParser(Schema.DateFromString)

const [d, setD] = useQueryState('d', dateParser)
setD(new Date('2026-01-01'))  // ?d=2026-01-01T00:00:00.000Z
```

## 4. Caveats

- **双射**：Effect Schema 天然 encode ↔ decode 对称，但写自定义 `transform`/`transformOrFail` 时仍然要保证双射，否则 `clearOnDefault` 行为错乱。
- **URL 长度**：base64url + JSON 是安全但膨胀率 ~1.33×；复杂对象记得加 URL 长度保护（见 [core.md](core.md) 的限制）。
- **Equal.equals**：对 Effect 生态的 `Class`/`struct`/`Option`/`Either` 都能正确处理结构相等，替代手写 `eq`。

## 5. 速查

| 需求 | 做法 |
|------|------|
| 通用适配器 | `createSchemaParser(Schema.Schema<T, E>)`，parse 用 Either.getOrNull，serialize 用 getOrThrowWith，eq 用 Equal.equals |
| URL 安全的 JSON 对象 | `Schema.StringFromBase64Url.pipe(Schema.parseJson()).pipe(MySchemaClass)` |
| 类式业务 model | `Schema.Class<X>('X')({…})` + `Positive`/`NonEmpty`/格式约束 |
| 日期字符串 | `Schema.DateFromString` |
