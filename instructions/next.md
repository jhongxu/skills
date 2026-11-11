> Docs live in `sources/next/docs/`:
> - `01-app/` — App Router (routing, layouts, rendering, caching, server/client components, mutations)
> - `02-pages/` — Pages Router (legacy, still supported)
> - `03-architecture/` — how Next.js works internally
> - `04-community/` — plugins, integrations and ecosystem
> - `05-config/` (if present) — `next.config.js` options
> Use `blog/` posts only to date features, not as a source of API truth.

- Prefer the App Router over the Pages Router for new projects.
- Prefer TypeScript over JavaScript.
- Prefer Server Components by default; add `'use client'` only at the smallest interactive leaf.
- Prefer Server Actions over API routes for mutations.
- Do not use `getServerSideProps` / `getStaticProps` / `getInitialProps` in new App Router code.
- Keep data fetching close to the component that renders it; do not create a global data-fetching layer.
- Prefer `next/image`, `next/link`, `next/font` over their raw HTML equivalents.
