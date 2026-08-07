---
name: nuqs
description: nuqs — 类型安全的 URL 查询参数状态管理（useQueryState / useQueryStates / parsers / 服务端）
---

# nuqs

`React.useState` 的 URL 版本：把状态存进 query string，类型安全、可分享、可刷新。`nuqs@^2`，框架无关（Next.js App/Pages、React SPA、Remix、React Router v6/v7/v8、TanStack Router）。

与 TanStack Router 自带 `validateSearch` 的关系：简单单路由 URL 状态用 router 内建即可（见 [../tanstack/references/router.md](../tanstack/references/router.md)）；跨路由/库组件共享/框架无关场景用 nuqs。

## References

| Topic | Reference |
|-------|-----------|
| Core API & Parsers | [core](references/core.md) |
| Options & Rate limiting | [options](references/options.md) |
| Server-side | [server-side](references/server-side.md) |
| Testing | [testing](references/testing.md) |
| Zod codecs 适配器（社区） | [parsers-community-zod](references/parsers-community-zod.md) |
| Effect Schema 适配器（社区） | [parsers-community-effect-schema](references/parsers-community-effect-schema.md) |
| TanStack Table 同步（社区） | [parsers-community-tanstack-table](references/parsers-community-tanstack-table.md) |
| Utilities | [utilities](references/utilities.md) |
| v1→v2 迁移 | [migration-v2](references/migration-v2.md) |
