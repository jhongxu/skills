# Server-side usage

> 面向 `nuqs@^2`。服务端解析从 `nuqs/server` 导入（避免 `'use client'` 指令）。API 基础见 [core.md](core.md)。

## `createLoader` — 服务端解析（v2.3+）

把 parser 描述对象复用到服务端，生成一个解析函数：

```ts
// search-params.ts
import { parseAsFloat, createLoader } from 'nuqs/server'

export const coordinatesParsers = {
  latitude: parseAsFloat.withDefault(0),
  longitude: parseAsFloat.withDefault(0),
}

export const loadSearchParams = createLoader(coordinatesParsers)
```

`loadSearchParams` 接受的输入类型：URL 字符串 / `?foo=bar` / `URL` / `URLSearchParams` / `Request` / `Record<string, string|string[]|undefined>` / 或以上任一的 `Promise`。返回与 `useQueryStates` 同形的 state。

### 各框架用法

**Next.js App Router**（`searchParams` 在 15+ 是 Promise）：

```tsx
// app/page.tsx
import { loadSearchParams } from './search-params'
import type { SearchParams } from 'nuqs/server'

type PageProps = { searchParams: Promise<SearchParams> }

export default async function Page({ searchParams }: PageProps) {
  const { latitude, longitude } = await loadSearchParams(searchParams)
  return <Map lat={latitude} lng={longitude} />
}
```

> 不一定要 await——可把 Promise 透传给 `<Suspense>` 内的子组件，配合 PPR/dynamicIO 先发静态外壳、再流式补动态部分。

**Next.js Pages Router**：

```ts
export async function getServerSideProps({ query }: GetServerSidePropsContext) {
  const { latitude } = loadSearchParams(query)
  return { props: { latitude } }
}
```

**Remix / React Router**：

```tsx
export function loader({ request }: LoaderFunctionArgs) {
  const { latitude } = loadSearchParams(request) // request.url 也行
}
```

**API routes**：

```ts
// app/api/location/route.ts
export async function GET(request: Request) {
  const { latitude } = loadSearchParams(request)
}
```

**任意位置（含 client）一次性解析非响应式 search params**：

```ts
loadSearchParams('https://example.com?latitude=42')
loadSearchParams(location.search)
loadSearchParams(new URLSearchParams(...))
```

### ⚠️ loader 不校验

loader 只解析不校验。要保证值合法（正整数、特定 JSON 形状等），把结果喂给 Zod 或用自定义 parser 内建校验。Zod 见 [../data-and-forms/references/zod.md](../../data-and-forms/references/zod.md)。

### strict mode（v2.5+）

默认非法值回退默认值（或 `null`）。开启 strict 后抛错：

```ts
const load = createLoader({ count: parseAsInteger.withDefault(0) })
load('?count=banana')                    // { count: 0 }（默认）
load('?count=banana', { strict: true }) // throws: Error parsing `banana` for key `count`
```

## `createSearchParamsCache` — RSC 树共享（仅 Next.js App Router）

在深层 Server Component 里访问 searchParams 时用。像服务端 Context：page 里 `parse`，任意子孙 Server Component 里 `get`。基于 `React.cache`，仅当次渲染有效。

```ts
// search-params.ts
import { createSearchParamsCache, parseAsInteger, parseAsString } from 'nuqs/server'

export const searchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(''),
  maxResults: parseAsInteger.withDefault(10),
})
```

```tsx
// app/page.tsx
type PageProps = { searchParams: Promise<SearchParams> }

export default async function Page({ searchParams }: PageProps) {
  const { q } = await searchParamsCache.parse(searchParams) // ⚠️ 别忘调 parse
  return (
    <div>
      <h1>Search: {q}</h1>
      <Results />
    </div>
  )
}

function Results() {
  const maxResults = searchParamsCache.get('maxResults') // 类型安全
  return <span>up to {maxResults}</span>
}
```

### 端到端类型一致：server cache + client hook 共享 parser

cache 仅服务端组件可用，但 parser 声明可与 client 端 `useQueryStates` 共享：

```ts
// search-params.ts
import { parseAsFloat, createSearchParamsCache } from 'nuqs/server'

export const coordinatesParsers = {
  lat: parseAsFloat.withDefault(45.18),
  lng: parseAsFloat.withDefault(5.72),
}
export const coordinatesCache = createSearchParamsCache(coordinatesParsers)
```

```tsx
// page.tsx
export default async function Page({ searchParams }) {
  await coordinatesCache.parse(searchParams, { strict: true })
  return (
    <>
      <Server />
      <Suspense><Client /></Suspense>
    </>
  )
}

// server.tsx
function Server() {
  const { lat, lng } = coordinatesCache.all()
  // 或逐个：coordinatesCache.get('lat')
  return <span>{lat},{lng}</span>
}
```

```tsx
// client.tsx
'use client'
import { useQueryStates } from 'nuqs'
import { coordinatesParsers } from './search-params'

function Client() {
  const [{ lat, lng }, set] = useQueryStates(coordinatesParsers)
  // ...
}
```

### cache 里用 `urlKeys`

与 `useQueryStates` 一致，可把长变量名映射到短 URL 键：

```ts
export const coordinatesCache = createSearchParamsCache(
  {
    latitude: parseAsFloat.withDefault(45.18),
    longitude: parseAsFloat.withDefault(5.72),
  },
  { urlKeys: { latitude: 'lat', longitude: 'lng' } },
)
```

## 速查

| 需求 | 选择 |
|------|------|
| 服务端一次性解析 | `createLoader`（`nuqs/server`） |
| 深层 Server Component 共享 | `createSearchParamsCache`（仅 Next App Router） |
| 非法值抛错而非回退 | `{ strict: true }`（v2.5+） |
| 端到端类型一致 | server cache + client `useQueryStates` 共享 parser 声明 |
| 校验业务规则 | loader 结果喂 Zod（loader 本身不校验） |
