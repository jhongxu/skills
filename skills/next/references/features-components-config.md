---
name: features-components-config
description: Next.js built-in components (Image, Link, Script, Font, Form), the Metadata API, and next.config.ts configuration options.
---

# Built-in Components & Config

## `next/image`

```tsx
import Image from 'next/image'

<Image src="/hero.png" alt="Hero" width={800} height={400} priority />
<Image src="/hero.png" alt="Hero" fill sizes="(max-width: 768px) 100vw, 50vw" />
```

- Automatic optimization, lazy loading by default, and no layout shift (`width`/`height` or `fill` are required).
- `fill` makes the image fill its parent — the parent **must** be positioned (`relative`/`absolute`).
- `sizes` tells the browser which width to pick at each breakpoint; always set it with `fill`.
- `priority` (or `preload`) for the LCP image — do not lazy-load it.
- Remote images need `images.remotePatterns` in `next.config.ts`.

## `next/link`

```tsx
import Link from 'next/link'

<Link href="/about" prefetch={false} scroll={false} replace>About</Link>
```

- Primary way to navigate internally: client-side transition + prefetch on viewport entry.
- Use a plain `<a>` for external URLs.

## `next/script`

```tsx
import Script from 'next/script'

<Script src="https://example.com/script.js" strategy="afterInteractive" onLoad={onLoad} />
```

- `strategy`: `beforeInteractive` (before hydration), `afterInteractive` (default, after hydration), `lazyOnload` (during idle), `worker` (offloaded to a web worker).
- Use `onLoad`/`onReady`/`onError` for callbacks. Prefer `afterInteractive` unless you truly need earlier execution.

## `next/font`

```tsx
import { Inter, localFont } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const mine = localFont({ src: './MyFont.woff2', variable: '--font-mine' })
```

- Fonts are downloaded at **build time** and self-hosted — no request to Google, no layout shift.
- Apply the generated `variable` to a CSS variable and use `var(--font-inter)` in your CSS.
- `display: 'swap'` avoids invisible text; `adjustFontFallback` reduces CLS.

## `next/form`

```tsx
import Form from 'next/form'

<Form action="/search"><input name="q" /><button>Go</button></Form>
```

- With a string action: native GET semantics, but prefetches the target and navigates client-side.
- With a function action: behaves like a React `<form>` (Server Action).

## Metadata API

```tsx
export const metadata: Metadata = { title: 'Blog', description: '...' }

export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  return { title: post.title, openGraph: { images: [post.image] } }
}
```

- `metadata` for static values, `generateMetadata` for dynamic ones.
- `viewport` and `themeColor` have their own exports (`generateViewport`).
- File conventions: `favicon.ico`, `icon.png`, `apple-icon.png`, `opengraph-image.tsx`, `sitemap.ts`, `robots.ts`, `manifest.ts`.

## `next.config.ts`

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.example.com' }] },
  experimental: { /* ... */ },
}

export default nextConfig
```

- `next.config.js` is a Node module (use `next.config.mjs` for ESM; `.cjs`/`.cts` are **not** supported). It can also export a function (async) to read env at build time.
- Common options: `images`, `redirects`, `rewrites`, `headers`, `env`, `output` (`'standalone'` for Docker), `trailingSlash`, `basePath`, `assetPrefix`, `cacheComponents`, `serverExternalPackages`, `typedRoutes`, `experimental`.
- `output: 'standalone'` produces a minimal server bundle for container deploys.
- `typedRoutes` gives type-safe `href` values.

<!--
Source references:
- https://nextjs.org/docs/app/api-reference/components/image
- https://nextjs.org/docs/app/api-reference/components/link
- https://nextjs.org/docs/app/api-reference/components/script
- https://nextjs.org/docs/app/api-reference/components/font
- https://nextjs.org/docs/app/api-reference/components/form
- https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- https://nextjs.org/docs/app/api-reference/config/next-config-js
-->
