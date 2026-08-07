---
name: tanstack-table
description: TanStack Table v9（octane）—— headless 表格库，声明式特性注册、细粒度状态订阅、组件化封装
---

# TanStack Table

`@tanstack/react-table@9`（核心包 `@tanstack/octane-table`，2026-08 稳定）。Headless 表格：管逻辑（排序/筛选/分页/选择等），markup 与样式完全归你。

v9 是全新 API：`tableFeatures({...})` 声明式注册特性（tree-shakeable，按需付费）、`useTable` 替代 `useReactTable`、状态基于 TanStack Store atoms（细粒度订阅）、`createTableHook` 组件化封装。旧 v8 API 仍可通过 `useLegacyTable` 兼容层使用（deprecated）。

## References

| Topic | Reference |
|-------|-----------|
| 核心 API（v9 心智 / tableFeatures / useTable / FlexRender） | [core](references/core.md) |
| 列定义与渲染（ColumnDef / columnHelper / cell / meta） | [columns](references/columns.md) |
| 特性速查（sorting / filtering / pagination / grouping 等） | [features](references/features.md) |
| 状态与组合（atoms / Subscribe / createTableHook / AppTable） | [state-and-composition](references/state-and-composition.md) |
| v8→v9 迁移与集成（useLegacyTable / Query / Router / Form / nuqs / 虚拟化） | [migration-and-integration](references/migration-and-integration.md) |
