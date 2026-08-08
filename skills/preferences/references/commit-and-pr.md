# Commit & PR

> 个人 Git 工作流偏好——Conventional Commits、per-scope 拆分提交、PR 聚焦"为什么"。目标是让 `git log` 可读、changelog 可生成、每个 commit 可独立 revert。

## 1. Conventional Commits

所有 commit message 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>           # 可选，解释"为什么"
<footer>         # 可选，BREAKING CHANGE / issue 引用
```

### type

| type | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | bug 修复 |
| `refactor` | 重构（不改行为） |
| `perf` | 性能优化 |
| `docs` | 文档变更 |
| `test` | 测试相关 |
| `chore` | 构建、依赖、配置（不影响功能） |
| `style` | 格式（不改逻辑） |
| `ci` | CI 配置 |
| `build` | 构建系统/依赖 |
| `revert` | 回滚 |

### scope

scope 表示影响范围，用仓库的模块路径：

```
feat(skills/foundation): write 5 references
fix(skills/ui): correct antd v6 migration table
feat(app/auth): add login page
chore(deps): bump zod to 4.3
```

> 本 skills 仓库：scope 是 `skills/{name}`（如 `skills/tanstack`），每个 skill 独立提交。见 [AGENTS.md](../../AGENTS.md)。

### subject

- 祈使句、现在时：`write 5 references`（不是 `wrote` / `writes`）
- 首字母小写（antfu 风格）：`add login page`（非 `Add login page`）
- 不加句号
- 聚焦"做了什么"，body 解释"为什么"

```bash
# ✅
git commit -m "feat(skills/data-and-forms): write 5 references"

# ✅ 多行用 HEREDOC
git commit -m "$(cat <<'EOF'
feat(skills/data-and-forms): write 5 references

zod v4 (breaking changes, Mini, Standard Schema), tRPC v11
(router/RSC/React Query), zustand v5 (useShallow, slices,
middleware), react-hook-form v7, msw v2.
EOF
)"

# ❌ 模糊
git commit -m "update stuff"
git commit -m "WIP"
git commit -m "fix bug"
```

## 2. Per-scope 拆分提交

**每个独立模块/skill 单独提交**，不混合多个 skill 的改动到一个 commit：

```bash
# ✅ 分别提交
git commit -m "feat(skills/ui): write antd v6 references"
git commit -m "feat(skills/nextjs): write 4 references"

# ❌ 混在一起
git commit -m "feat: write ui and nextjs references"
```

好处：
- `git log` 清晰，每个 commit 一个完整变更
- 可独立 revert（revert ui 不影响 nextjs）
- PR review 聚焦
- 自动生成 changelog 时按 scope 分组

> 见 [AGENTS.md](../../AGENTS.md)：「每个 skill 的改动应该独立提交以保持提交历史清晰」。

### 提交粒度

| 粒度 | 做法 |
|------|------|
| 一个 skill 的所有 reference | 一个 commit（如 5 篇 foundation reference 一个 commit） |
| 修复 + 相关测试 | 一个 commit（fix 和它的测试不拆） |
| 重构 + 功能 | 拆开（refactor 一个 commit，feat 另一个） |
| 格式化 + 逻辑改动 | 拆开（style 一个，feat 另一个） |

## 3. Staging 策略

```bash
# ✅ 按文件名精确添加（避免误提交）
git add skills/foundation/references/pnpm.md skills/foundation/references/vitest.md

# ⚠️ 谨慎用
git add .                # 可能带入意外文件（.env、临时文件）
git add -A               # 同上
git add -p               # 交互式选择 hunk（精细控制时用）
```

> 绝不提交 `.env`、`credentials.json`、密钥。pre-commit hook 见 [../foundation/references/eslint-antfu.md](../foundation/references/eslint-antfu.md) 可拦截。

## 4. Git 安全红线

| 操作 | 规则 |
|------|------|
| `git push --force` 到 main/master | **禁止**；用 `--force-with-lease` 且仅在 feature 分支 |
| `git reset --hard` | 谨慎；优先 `git stash` 或 `git restore` |
| `git commit --amend` | 已推送的 commit 不 amend；改完新提交 |
| `--no-verify` | 不跳 pre-commit hook；hook 失败先修问题 |
| `git push` 未经确认 | 推送到远程是外发操作；确认后再推 |
| `git clean -f` | 谨慎；可能删未跟踪的重要文件 |

> 误删恢复：`git reflog` 查所有 HEAD 移动，`git reset --hard <ref>` 恢复。

## 5. 分支工作流

```bash
# 从 main 切 feature 分支
git checkout main
git pull
git checkout -b feat/user-auth

# 开发中：频繁小提交
git commit -m "feat(auth): add login form"
git commit -m "feat(auth): add session check"
git commit -m "test(auth): cover redirect logic"

# 合并前 rebase 保持线性历史
git fetch origin
git rebase origin/main

# 推送
git push -u origin feat/user-auth
```

### rebase vs merge

| 场景 | 选择 |
|------|------|
| feature 分支同步 main 最新 | rebase（线性历史） |
| 多人协作的长期分支 | merge（保留协作记录） |
| 已推送的分支 rebase | `--force-with-lease` 推送（仅 feature 分支） |

> 个人项目优先 rebase，`git log` 线性可读。

## 6. PR 规范

### 标题

- < 70 字符
- Conventional Commits 格式：`feat(scope): summary`

```bash
gh pr create --title "feat(skills): add data-and-forms references" --body "..."
```

### Body 结构

```markdown
## Summary
- 一句话说明改了什么
- 关键决策点（为什么这么做）

## Test plan
- [ ] lint 通过
- [ ] 测试通过
- [ ] 手动验证 xxx

## Notes（可选）
- 破坏性变更说明
- 后续 TODO
```

```bash
gh pr create --title "feat(skills/data-and-forms): add 5 references" --body "$(cat <<'EOF'
## Summary
- 新增 zod/trpc/zustand/react-hook-form/msw 5 篇 reference
- 对齐最新稳定版本（Zod 4、tRPC v11 等）

## Test plan
- [x] pnpm start lint 通过（14 skills）
- [x] 交叉引用链接已验证
EOF
)"
```

### PR 粒度

- 一个 PR 一个主题（一个 skill 或一个功能）
- 不超过 ~500 行 diff（review 友好）；大了拆多个 PR
- PR 里多个 commit 保留（不 squash），让 reviewer 看演进过程

## 7. Commit 示例（本仓库实际格式）

```bash
# 写 skill reference
git commit -m "feat(skills/foundation): write 5 references"

# 修复 skill 内容
git commit -m "fix(skills/tanstack): correct router search params section"

# 同步 vendor skill
git commit -m "chore(vendors): sync web-design-guidelines from upstream"

# 工具链
git commit -m "chore(deps): bump vitest to 3.2"
git commit -m "ci: add parallel test sharding"
```

## 8. 与本仓库其他 skill 的衔接

- 本仓库提交规范见 [AGENTS.md](../../AGENTS.md)（per-skill 独立提交）。
- pre-commit hook（lint/format/typecheck）见 [../foundation/references/eslint-antfu.md](../foundation/references/eslint-antfu.md)。
- 发版 changelog 由 Conventional Commits 自动生成（`changelogithub` / `release-please`）。
- 分支命名见 [naming](naming.md) 的 Git 分支一节。

## 9. 坑

| 坑 | 说明 |
|----|------|
| `git add .` 带入 `.env` | 按文件名精确 add；`.gitignore` 配好 |
| 一个 commit 混多 skill | 拆开；每 skill 独立 commit |
| commit message 只写"what"不写"why" | subject 写 what，body 写 why |
| `--amend` 已推送的 commit | 别人基于旧 commit 工作会冲突；新提交 |
| `--no-verify` 跳 hook | hook 失败先修；跳过等于没保护 |
| force push 到 main | 禁止；覆盖他人历史 |
| PR 标题超 70 字符 | 截断；详情放 body |
| PR 里 squash 所有 commit | 保留演进；reviewer 看逐步构建更清晰 |
| commit message 大写开头 | antfu 风格小写：`add` 非 `Add` |
| 模糊 message（`fix`/`update`） | 写具体：`fix(auth): handle expired token redirect` |
