# Skills 编写约定（React 栈）

本仓库收录 React 栈的 Agent Skills。维护与编写规则如下。

## 仓库结构

```
.                          # 仓库根
├── meta.ts                # 单一配置源：manual + vendors
├── scripts/cli.ts         # pnpm start {sync,check,lint,cleanup}
├── README.md              # 项目介绍
├── AGENTS.md              # 本文件
├── docs/                  # spec / plan 归档
└── skills/
    ├── SKILL.md           # 顶层索引（agent 加载本仓库的入口）
    ├── {name}/            # 单一 skill
    │   ├── SKILL.md       # 该 skill 的索引
    │   └── references/    # 单个概念一篇
    └── ...
```

`meta.ts` 中的三块：

- `submodules`: **空**（本仓库不再从上游 docs 生成 skill）
- `vendors`: 仅 `web-design-guidelines`（同步 vercel-labs/agent-skills 的 3 个 React skill）
- `manual`: 8 个手写 skill 名称

## 新增 Skill

1. 在 `meta.ts` 的 `manual` 数组加名字
2. `mkdir -p skills/{name}/references`
3. 写 `skills/{name}/SKILL.md`（含 `name:`、`description:` frontmatter；下方 `## References` 列出待写文件）
4. 跑 `pnpm start lint` 校验 frontmatter
5. 提交

## 编写约定

1. **每个 reference 一篇一个概念**，文件名 `category-concept.md`。
2. **实战优先**：能跑代码就贴代码，不抄文档。
3. **跨 skill 引用**：用相对路径，例如 `[zod.md](../data-and-forms/references/zod.md)`。
4. **第三方 API 必须用 Context7 查最新文档**（Ant Design v6、tRPC、StyleX、TanStack Form 等版本敏感），不依赖训练数据。
5. **不写 placeholder / TBD**：不确定的内容先不写。
6. **不修改 vendor-synced 的 skill 内容**——修改需贡献给上游 `vercel-labs/agent-skills`。
7. **删除 skill 必须先从 `meta.ts` 的 `manual` 移除，再跑 `pnpm start cleanup`**。

## 同步 Vendor

```bash
pnpm start check    # 看上游是否有更新
pnpm start sync     # 拉取并写入 skills/{name}/ + SYNC.md
```

只同步 `meta.ts` 的 `vendors` 中声明的 skill；sources 已废弃。

## 发布

```bash
git push origin main
# 用户通过 pnpx skills add jhongxu/skills --skill='*' 安装
```
