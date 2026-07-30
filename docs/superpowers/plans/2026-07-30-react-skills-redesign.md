# React Skills 仓库重构 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 antfu/skills fork 改造为 React 栈的个人 Agent Skills 集合，删除所有 Vue 生态内容，引入 vercel-labs/agent-skills 作为唯一 vendor。

**Architecture:** 删除 9 个 `sources/`、5 个 `vendor/`（保留 web-design-guidelines）、17 个 Vue skill 目录、9 个 instructions 文件、pnpm-workspace.yaml；改写 `meta.ts` / `scripts/cli.ts` / `README.md` / `AGENTS.md` / `package.json`；新建顶层 `skills/SKILL.md` 与 8 个手写 skill 的 `SKILL.md` 骨架；通过 `pnpm start sync` 拉取 3 个 React vendor skill。

**Tech Stack:** pnpm、TypeScript、Node、`@clack/prompts`、git submodule。

---

## 提交策略

Spec 第 7.13 步写「一次性提交」，但实施时**改为按阶段提交**（删除阶段 / 改写阶段 / 新建阶段 / 同步阶段各一个 commit），便于出错时按阶段回滚。最终会有 1 个「chore: 终检」commit 收尾。

---

## Task 1: 删除 `sources/` 全部 submodule（9 个）

**Files:**
- Delete: `sources/{vue,nuxt,pinia,pnpm,unocss,vite,vitepress,vitest,nitro}/`（git submodule）
- Modify: `.gitmodules`（git 自动重写）

- [ ] **Step 1: 批量 `git submodule deinit -f` 9 个 sources/**

```bash
git submodule deinit -f sources/vue sources/nuxt sources/pinia sources/pnpm sources/unocss sources/vite sources/vitepress sources/vitest sources/nitro
```

Expected: 无输出（或每个子目录 deinit 成功提示）。

- [ ] **Step 2: 批量 `git rm` 9 个 sources/**

```bash
git rm -f sources/vue sources/nuxt sources/pinia sources/pnpm sources/unocss sources/vite sources/vitepress sources/vitest sources/nitro
```

Expected: `rm 'sources/vue' ...` 等 9 行。

- [ ] **Step 3: 清理 `.git/modules/` 中残留的 sources 元数据**

```bash
rm -rf .git/modules/sources
```

Expected: 无输出（命令成功）。

- [ ] **Step 4: 验证 sources/ 已清空**

```bash
ls sources/ 2>&1
git submodule status | grep sources || echo "no sources submodules (expected)"
```

Expected: 第二个命令输出 `no sources submodules (expected)`。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "chore: remove 9 Vue sources submodules

删除 sources/ 下全部 9 个 Vue 文档源（vue/nuxt/pinia/pnpm/unocss/
vite/vitepress/vitest/nitro），本仓库不再从上游 docs 生成 skill。"

git status -s
```

Expected: `git status -s` 输出为空。

---

## Task 2: 删除 `vendor/` 中 5 个 Vue submodule（保留 web-design-guidelines）

**Files:**
- Delete: `vendor/{slidev,tsdown,turborepo,vuejs-ai,vueuse}/`（git submodule）
- Modify: `.gitmodules`（保留 web-design-guidelines 一条）

- [ ] **Step 1: 批量 `git submodule deinit -f` 5 个 vendor/**

```bash
git submodule deinit -f vendor/slidev vendor/tsdown vendor/turborepo vendor/vuejs-ai vendor/vueuse
```

- [ ] **Step 2: 批量 `git rm` 5 个 vendor/**

```bash
git rm -f vendor/slidev vendor/tsdown vendor/turborepo vendor/vuejs-ai vendor/vueuse
```

Expected: 5 行 `rm 'vendor/xxx'`。

- [ ] **Step 3: 清理残留元数据**

```bash
rm -rf .git/modules/vendor/slidev .git/modules/vendor/tsdown .git/modules/vendor/turborepo .git/modules/vendor/vuejs-ai .git/modules/vendor/vueuse
```

- [ ] **Step 4: 验证 vendor/web-design-guidelines 仍存在**

```bash
ls vendor/web-design-guidelines/ | head -5
git submodule status | grep web-design-guidelines
```

Expected: 第一条命令列出 5+ 文件（README.md 等）；第二条命令显示 `vendor/web-design-guidelines` 一行（带 commit SHA）。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "chore: remove 5 Vue vendor submodules

删除 vendor/slidev, tsdown, turborepo, vuejs-ai, vueuse。
保留 vendor/web-design-guidelines 作为唯一 React skill 同步源。"

git status -s
```

Expected: `git status -s` 输出为空。

---

## Task 3: 删除 17 个 Vue skill 目录

**Files:**
- Delete: `skills/{vue,nuxt,pinia,pnpm,unocss,vite,vitepress,vitest,nitro,slidev,tsdown,turborepo,vueuse-functions,vue-best-practices,vue-router-best-practices,vue-testing-best-practices,web-design-guidelines}/`

注：`skills/web-design-guidelines/` 也会被删除，但 `pnpm start sync` 会在 Task 11 重新生成。

- [ ] **Step 1: 一次性 `rm -rf` 17 个目录**

```bash
rm -rf \
  skills/vue \
  skills/nuxt \
  skills/pinia \
  skills/pnpm \
  skills/unocss \
  skills/vite \
  skills/vitepress \
  skills/vitest \
  skills/nitro \
  skills/slidev \
  skills/tsdown \
  skills/turborepo \
  skills/vueuse-functions \
  skills/vue-best-practices \
  skills/vue-router-best-practices \
  skills/vue-testing-best-practices \
  skills/web-design-guidelines
```

- [ ] **Step 2: 验证 skills/ 剩余 2 个手写 skill**

```bash
ls skills/
```

Expected: 仅 `antfu/` 与 `antfu-design/`（旧的 2 个手写 skill，下一阶段会被重写或替换）。

- [ ] **Step 3: 暂不提交**（与 Task 4/5 一起作为「改写阶段」提交）

```bash
git status -s | wc -l
```

Expected: 17（17 个 skill 目录被 git 视为删除）。

---

## Task 4: 删除 `instructions/` 与 `pnpm-workspace.yaml`

**Files:**
- Delete: `instructions/{vue,nuxt,pinia,pnpm,unocss,vite,vitepress,vitest,tsdown}.md`（9 个文件）
- Delete: `pnpm-workspace.yaml`

- [ ] **Step 1: 删除 instructions/ 全部**

```bash
rm -rf instructions/
```

- [ ] **Step 2: 删除 pnpm-workspace.yaml**

```bash
rm -f pnpm-workspace.yaml
```

- [ ] **Step 3: 验证**

```bash
ls instructions/ 2>&1 | head -1
ls pnpm-workspace.yaml 2>&1
```

Expected: 两条命令都报「No such file or directory」。

- [ ] **Step 4: 与 Task 3 一起提交（改写阶段第 1 个 commit）**

```bash
git add -A
git commit -m "chore: remove 17 Vue skills and Vue-specific scaffolding

删除 skills/ 下 17 个 Vue 生态 skill 目录、9 个 instructions/
指引文件、pnpm-workspace.yaml（无 workspace 需求）。"

git status -s
```

Expected: `git status -s` 输出为空。

---

## Task 5: 重写 `meta.ts`

**Files:**
- Modify: `meta.ts`（全文）

- [ ] **Step 1: 写入新的 `meta.ts`**

完整新文件内容（替换原文件）：

```ts
export interface VendorSkillMeta {
  official?: boolean
  source: string
  skillsPath?: string // Optional custom path to skills directory (default: 'skills')
  skills: Record<string, string> // sourceSkillName -> outputSkillName
}

/**
 * Repositories to clone as submodules and generate skills from source.
 * Empty: this repo no longer generates skills from upstream docs.
 * Use Context7 to fetch docs when writing skills.
 */
export const submodules = {} as const

/**
 * Already generated skills, sync with their `skills/` directory.
 * Only React-related skills from vercel-labs/agent-skills.
 */
export const vendors: Record<string, VendorSkillMeta> = {
  'web-design-guidelines': {
    source: 'https://github.com/vercel-labs/agent-skills',
    skills: {
      'react-best-practices': 'react-best-practices',
      'composition-patterns': 'composition-patterns',
      'web-design-guidelines': 'web-design-guidelines',
    },
  },
}

/**
 * Hand-written skills
 */
export const manual = [
  'foundation',
  'react',
  'nextjs',
  'tanstack',
  'ui',
  'data-and-forms',
  'testing',
  'preferences',
]
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
pnpm exec tsc --noEmit meta.ts
```

Expected: 无错误输出（exit code 0）。如果提示「Cannot find module 'node:...'」之类，是因为 meta.ts 在 ESM 上下文，tsc 需要看 tsconfig.json，命令应改为 `pnpm exec tsc --noEmit` 在仓库根跑。

```bash
cd /Users/jhongxu/work-space/myself/skills && pnpm exec tsc --noEmit
```

Expected: 0 errors。

- [ ] **Step 3: 提交**

```bash
git add meta.ts
git commit -m "refactor(meta): empty submodules, single React vendor, React manual list

- submodules: 清空（本仓库不再从上游 docs 生成 skill）
- vendors: 仅保留 vercel-labs/agent-skills（同步 3 个 React skill）
- manual: 改为 8 个 React 栈手写 skill"

git status -s
```

---

## Task 6: 重写 `scripts/cli.ts`

**Files:**
- Modify: `scripts/cli.ts`（全文重写）

新文件应实现：
- 移除 `initSubmodules()`（submodule 不再使用）
- 简化 `syncSubmodules()`：只遍历 `vendors`（已无 sources）
- 新增 `lintSkills()` 子命令：校验 `skills/{name}/SKILL.md` 存在 + frontmatter 合法
- 保留 `checkUpdates()`：只检查 `vendors`（不检查 sources）
- 保留 `cleanup()`：仍按 `submodules + vendors + manual` 汇总

完整新 `scripts/cli.ts`：

```ts
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as p from '@clack/prompts'
import { manual, vendors } from '../meta.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function exec(cmd: string, cwd = root): string {
  return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
}

function execSafe(cmd: string, cwd = root): string | null {
  try {
    return exec(cmd, cwd)
  }
  catch {
    return null
  }
}

function getGitSha(dir: string): string | null {
  return execSafe('git rev-parse HEAD', dir)
}

function getExistingSubmodulePaths(): string[] {
  const gitmodules = join(root, '.gitmodules')
  if (!existsSync(gitmodules))
    return []
  const content = readFileSync(gitmodules, 'utf-8')
  const matches = content.matchAll(/path\s*=\s*(.+)/g)
  return Array.from(matches, match => match[1].trim())
}

interface Project {
  name: string
  url: string
  type: 'vendor'
  path: string
}

function getExpectedSkillNames(): Set<string> {
  const expected = new Set<string>()
  for (const config of Object.values(vendors)) {
    for (const outputName of Object.values(config.skills)) {
      expected.add(outputName)
    }
  }
  for (const name of manual) {
    expected.add(name)
  }
  return expected
}

function getExistingSkillNames(): string[] {
  const skillsDir = join(root, 'skills')
  if (!existsSync(skillsDir))
    return []
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
}

async function syncSubmodules() {
  const spinner = p.spinner()
  spinner.start('Updating vendor submodules...')
  try {
    exec('git submodule update --remote --merge')
    spinner.stop('Vendor submodules updated')
  }
  catch (e) {
    spinner.stop(`Failed to update submodules: ${e}`)
    return
  }

  for (const [vendorName, config] of Object.entries(vendors)) {
    const vendorPath = join(root, 'vendor', vendorName)
    const skillsBasePath = config.skillsPath || 'skills'
    const vendorSkillsPath = join(vendorPath, skillsBasePath)

    if (!existsSync(vendorPath)) {
      p.log.warn(`Vendor submodule not found: ${vendorName}. Run init first.`)
      continue
    }
    if (!existsSync(vendorSkillsPath)) {
      p.log.warn(`No skills directory in vendor/${vendorName}/${skillsBasePath}/`)
      continue
    }

    for (const [sourceSkillName, outputSkillName] of Object.entries(config.skills)) {
      const sourceSkillPath = join(vendorSkillsPath, sourceSkillName)
      const outputPath = join(root, 'skills', outputSkillName)

      if (!existsSync(sourceSkillPath)) {
        p.log.warn(`Skill not found: vendor/${vendorName}/skills/${sourceSkillName}`)
        continue
      }

      spinner.start(`Syncing skill: ${sourceSkillName} → ${outputSkillName}`)

      if (existsSync(outputPath)) {
        rmSync(outputPath, { recursive: true })
      }
      mkdirSync(outputPath, { recursive: true })

      const files = readdirSync(sourceSkillPath, { recursive: true, withFileTypes: true })
      for (const file of files) {
        if (file.isFile()) {
          const fullPath = join(file.parentPath, file.name)
          const relativePath = fullPath.replace(sourceSkillPath, '')
          const destPath = join(outputPath, relativePath)
          const destDir = dirname(destPath)
          if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true })
          }
          cpSync(fullPath, destPath)
        }
      }

      const licenseNames = ['LICENSE', 'LICENSE.md', 'LICENSE.txt']
      for (const licenseName of licenseNames) {
        const licensePath = join(vendorPath, licenseName)
        if (existsSync(licensePath)) {
          cpSync(licensePath, join(outputPath, 'LICENSE.md'))
          break
        }
      }

      const sha = getGitSha(vendorPath)
      const syncPath = join(outputPath, 'SYNC.md')
      const date = new Date().toISOString().split('T')[0]
      writeFileSync(syncPath, `# Sync Info

- **Source:** \`vendor/${vendorName}/${skillsBasePath}/${sourceSkillName}\`
- **Git SHA:** \`${sha}\`
- **Synced:** ${date}
`)
      spinner.stop(`Synced: ${sourceSkillName} → ${outputSkillName}`)
    }
  }
  p.log.success('All skills synced')
}

async function checkUpdates() {
  const spinner = p.spinner()
  spinner.start('Fetching remote changes...')
  try {
    exec('git submodule foreach git fetch')
    spinner.stop('Fetched remote changes')
  }
  catch (e) {
    spinner.stop(`Failed to fetch: ${e}`)
    return
  }

  const updates: { name: string, type: string, behind: number }[] = []
  for (const [name, config] of Object.entries(vendors)) {
    const path = join(root, 'vendor', name)
    if (!existsSync(path))
      continue
    const behind = execSafe('git rev-list HEAD..@{u} --count', path)
    const count = behind ? Number.parseInt(behind) : 0
    if (count > 0) {
      const skillNames = Object.values(config.skills).join(', ')
      updates.push({ name: `${name} (${skillNames})`, type: 'vendor', behind: count })
    }
  }

  if (updates.length === 0) {
    p.log.success('All vendor submodules are up to date')
  }
  else {
    p.log.info('Updates available:')
    for (const update of updates) {
      p.log.message(`  ${update.name} (${update.type}): ${update.behind} commits behind`)
    }
  }
}

function getFrontmatter(content: string): { valid: boolean, reason?: string } {
  if (!content.startsWith('---')) {
    return { valid: false, reason: 'missing opening frontmatter delimiter' }
  }
  const end = content.indexOf('\n---', 3)
  if (end === -1) {
    return { valid: false, reason: 'missing closing frontmatter delimiter' }
  }
  const block = content.slice(3, end)
  if (!/^name:\s*\S/m.test(block)) {
    return { valid: false, reason: 'missing `name:` field' }
  }
  if (!/^description:\s*\S/m.test(block)) {
    return { valid: false, reason: 'missing `description:` field' }
  }
  return { valid: true }
}

function lintSkills() {
  const spinner = p.spinner()
  spinner.start('Linting skills...')

  const skills = getExistingSkillNames()
  const errors: string[] = []

  for (const name of skills) {
    const skillPath = join(root, 'skills', name)
    const stat = existsSync(skillPath)
    if (!stat) {
      errors.push(`skills/${name}: directory not found`)
      continue
    }
    const skillMd = join(skillPath, 'SKILL.md')
    if (!existsSync(skillMd)) {
      errors.push(`skills/${name}: SKILL.md missing`)
      continue
    }
    const content = readFileSync(skillMd, 'utf-8')
    const result = getFrontmatter(content)
    if (!result.valid) {
      errors.push(`skills/${name}/SKILL.md: ${result.reason}`)
    }
  }

  spinner.stop('Lint complete')

  if (errors.length === 0) {
    p.log.success(`All ${skills.length} skills pass lint`)
  }
  else {
    p.log.error(`Found ${errors.length} error(s):`)
    for (const e of errors) {
      p.log.message(`  - ${e}`)
    }
    process.exit(1)
  }
}

async function cleanup() {
  const spinner = p.spinner()
  const expected = getExpectedSkillNames()
  const existing = getExistingSkillNames()
  const orphans = existing.filter(name => !expected.has(name))

  if (orphans.length === 0) {
    p.log.success('No orphan skills found')
    return
  }

  p.log.warn(`Found ${orphans.length} orphan skill(s):`)
  for (const name of orphans) {
    p.log.message(`  - skills/${name}`)
  }
  const shouldRemove = await p.confirm({
    message: 'Remove these orphan skills?',
    initialValue: true,
  })
  if (p.isCancel(shouldRemove) || !shouldRemove) {
    p.cancel('Cancelled')
    return
  }

  for (const name of orphans) {
    spinner.start(`Removing: skills/${name}`)
    rmSync(join(root, 'skills', name), { recursive: true })
    spinner.stop(`Removed: skills/${name}`)
  }
  p.log.success('Cleanup completed')
}

async function main() {
  const args = process.argv.slice(2)
  const skipPrompt = args.includes('-y') || args.includes('--yes')
  const command = args.find(arg => !arg.startsWith('-'))

  if (command === 'sync') {
    p.intro('Skills Manager - Sync')
    await syncSubmodules()
    p.outro('Done')
    return
  }
  if (command === 'check') {
    p.intro('Skills Manager - Check')
    await checkUpdates()
    p.outro('Done')
    return
  }
  if (command === 'lint') {
    p.intro('Skills Manager - Lint')
    lintSkills()
    p.outro('Done')
    return
  }
  if (command === 'cleanup') {
    p.intro('Skills Manager - Cleanup')
    await cleanup()
    p.outro('Done')
    return
  }

  if (skipPrompt) {
    p.log.error('Command required when using -y flag')
    p.log.info('Available commands: sync, check, lint, cleanup')
    process.exit(1)
  }

  p.intro('Skills Manager')
  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'sync', label: 'Sync vendors', hint: 'Pull latest and sync Type 2 skills' },
      { value: 'check', label: 'Check updates', hint: 'See available updates from upstream' },
      { value: 'lint', label: 'Lint skills', hint: 'Validate SKILL.md frontmatter' },
      { value: 'cleanup', label: 'Cleanup', hint: 'Remove orphan skills' },
    ],
  })
  if (p.isCancel(action)) {
    p.cancel('Cancelled')
    process.exit(0)
  }
  switch (action) {
    case 'sync': await syncSubmodules(); break
    case 'check': await checkUpdates(); break
    case 'lint': lintSkills(); break
    case 'cleanup': await cleanup(); break
  }
  p.outro('Done')
}

main().catch(console.error)
```

- [ ] **Step 2: 验证 cli.ts 通过 TS 编译**

```bash
pnpm exec tsc --noEmit
```

Expected: 0 errors。

- [ ] **Step 3: 验证 `pnpm start lint` 能运行（应当报告 errors，因为旧 skill 还没建）**

```bash
pnpm start lint
```

Expected: 报 ≥1 个 error（SKILL.md missing），**这是预期行为**——script 工作正常，只是当前还没有新 skill。

- [ ] **Step 4: 提交**

```bash
git add scripts/cli.ts
git commit -m "refactor(cli): drop init, simplify sync, add lint subcommand

- 移除 initSubmodules（submodule 流程废弃）
- 简化 syncSubmodules：仅遍历 vendors
- 简化 checkUpdates：仅检查 vendors
- 新增 lintSkills：校验 SKILL.md frontmatter"
```

---

## Task 7: 写顶层 `skills/SKILL.md`

**Files:**
- Create: `skills/SKILL.md`

- [ ] **Step 1: 写入文件**

```markdown
---
name: react-skills
description: React 栈 Agent Skills 集合（Next.js / TanStack / StyleX / antd v6 / tRPC）
---

# React 栈 Agent Skills 集合

本仓库为 React 技术栈定制，按需加载。

## 加载方式

- 全量加载：`*`
- 挑选加载：`nextjs,tanstack,data-and-forms,testing`
- 在项目 `AGENTS.md` / `CLAUDE.md` 引用 skill 名称，agent 启动时自动加载

## Skill 索引

### 手写 Skills

| Skill | 说明 | 适用场景 |
|-------|------|----------|
| foundation | pnpm / tsdown / vitest / eslint / unocss 底座 | 任何 React 项目 |
| react | React 核心 API 与模式 | 任何 React 项目 |
| nextjs | Next.js App Router / RSC / Server Actions | Next.js 项目 |
| tanstack | TanStack Router / Query / Form | 路由 + 服务端状态 |
| ui | StyleX / antd v6 / UnoCSS | 组件与样式 |
| data-and-forms | tRPC / zod / zustand / msw / react-hook-form | 数据层与表单 |
| testing | Vitest / Playwright / Storybook | 测试 |
| preferences | 个人项目结构 / 命名 / 提交规范 | 个人风格统一 |

### 同步 Skills（来自 vercel-labs/agent-skills）

| Skill | 说明 |
|-------|------|
| react-best-practices | React 最佳实践（Vercel 维护） |
| composition-patterns | 组件组合模式 |
| web-design-guidelines | Web 设计规范 |
```

- [ ] **Step 2: 验证文件已创建**

```bash
ls -la skills/SKILL.md && head -3 skills/SKILL.md
```

Expected: 文件存在且首行是 `---`。

- [ ] **Step 3: 暂不提交**（与 Task 8 一起提交「新建阶段」commit）

---

## Task 8: 创建 8 个手写 skill 的 SKILL.md 骨架

**Files:** 8 个 `Create: skills/{name}/SKILL.md` + 8 个 `Create: skills/{name}/references/.gitkeep`（占位空目录）

- [ ] **Step 1: 一次性 mkdir 8 个 skill 目录**

```bash
mkdir -p \
  skills/foundation/references \
  skills/react/references \
  skills/nextjs/references \
  skills/tanstack/references \
  skills/ui/references \
  skills/data-and-forms/references \
  skills/testing/references \
  skills/preferences/references
```

- [ ] **Step 2: 写入 `skills/foundation/SKILL.md`**

```markdown
---
name: foundation
description: 工程化底座（pnpm / tsdown / vitest / eslint / unocss），与框架无关
---

# Foundation

React 项目的工程化底座。所有 React 项目默认加载。

## References

| Topic | Reference |
|-------|-----------|
| pnpm | [pnpm](references/pnpm.md) |
| tsdown | [tsdown](references/tsdown.md) |
| vitest | [vitest](references/vitest.md) |
| eslint (antfu config) | [eslint-antfu](references/eslint-antfu.md) |
| unocss | [unocss](references/unocss.md) |
```

- [ ] **Step 3: 写入 `skills/react/SKILL.md`**

```markdown
---
name: react
description: React 核心 API 与组件模式（hooks、并发、Suspense、错误边界）
---

# React

React 核心 API 与常用模式。

## References

| Topic | Reference |
|-------|-----------|
| Core Hooks | [core-hooks](references/core-hooks.md) |
| Component Patterns | [component-patterns](references/component-patterns.md) |
| Server Components | [server-components](references/server-components.md) |
| Concurrent Features | [concurrent-features](references/concurrent-features.md) |
```

- [ ] **Step 4: 写入 `skills/nextjs/SKILL.md`**

```markdown
---
name: nextjs
description: Next.js（App Router 优先）— RSC、Server Actions、data fetching
---

# Next.js

Next.js 框架惯例与最佳实践，重点是 App Router。

## References

| Topic | Reference |
|-------|-----------|
| App Router | [app-router](references/app-router.md) |
| Data Fetching | [data-fetching](references/data-fetching.md) |
| Server Actions | [server-actions](references/server-actions.md) |
| RSC Patterns | [rsc-patterns](references/rsc-patterns.md) |
```

- [ ] **Step 5: 写入 `skills/tanstack/SKILL.md`**

```markdown
---
name: tanstack
description: TanStack Router / Query / Form
---

# TanStack

TanStack 三大件：Router、Query、Form。

## References

| Topic | Reference |
|-------|-----------|
| Router | [router](references/router.md) |
| Query | [query](references/query.md) |
| Form | [form](references/form.md) |
```

- [ ] **Step 6: 写入 `skills/ui/SKILL.md`**

```markdown
---
name: ui
description: StyleX / antd v6 / UnoCSS — 样式与组件库
---

# UI

样式与组件库三层：StyleX 原子、antd v6 组件、UnoCSS 工具类。

## References

| Topic | Reference |
|-------|-----------|
| StyleX | [stylex](references/stylex.md) |
| Ant Design v6 | [antd-v6](references/antd-v6.md) |
| Icon & Theming | [icon-and-theming](references/icon-and-theming.md) |
```

- [ ] **Step 7: 写入 `skills/data-and-forms/SKILL.md`**

```markdown
---
name: data-and-forms
description: tRPC / zod / zustand / msw / react-hook-form
---

# Data & Forms

数据层、状态、表单、API mock。

## References

| Topic | Reference |
|-------|-----------|
| tRPC | [trpc](references/trpc.md) |
| Zod | [zod](references/zod.md) |
| Zustand | [zustand](references/zustand.md) |
| React Hook Form | [react-hook-form](references/react-hook-form.md) |
| MSW | [msw](references/msw.md) |
```

- [ ] **Step 8: 写入 `skills/testing/SKILL.md`**

```markdown
---
name: testing
description: Vitest / Playwright / Storybook
---

# Testing

单元、组件、E2E、视觉测试。

## References

| Topic | Reference |
|-------|-----------|
| Vitest + React | [vitest-react](references/vitest-react.md) |
| Playwright | [playwright](references/playwright.md) |
| Storybook | [storybook](references/storybook.md) |
```

- [ ] **Step 9: 写入 `skills/preferences/SKILL.md`**

```markdown
---
name: preferences
description: 个人项目结构 / 命名 / 提交规范（参考原 antfu skill 风格）
---

# Preferences

个人工程偏好。新项目从这些约定起步。

## References

| Topic | Reference |
|-------|-----------|
| Project Structure | [project-structure](references/project-structure.md) |
| Naming | [naming](references/naming.md) |
| Commit & PR | [commit-and-pr](references/commit-and-pr.md) |
```

- [ ] **Step 10: 验证 8 个 SKILL.md 都存在且 frontmatter 合法**

```bash
for d in foundation react nextjs tanstack ui data-and-forms testing preferences; do
  test -f "skills/$d/SKILL.md" && echo "✓ skills/$d/SKILL.md" || echo "✗ MISSING skills/$d/SKILL.md"
done
```

Expected: 8 行 `✓`。

- [ ] **Step 11: 跑 `pnpm start lint`**

```bash
pnpm start lint
```

Expected: `All N skills pass lint`（N=10：8 个新 + 2 个旧 antfu/*，因 antfu/ 与 antfu-design/ 还没删）。

- [ ] **Step 12: 提交「新建阶段」**

```bash
git add skills/SKILL.md skills/foundation skills/react skills/nextjs skills/tanstack skills/ui skills/data-and-forms skills/testing skills/preferences
git commit -m "feat(skills): scaffold 8 hand-written React skills + top-level index

新增 8 个 React 栈手写 skill 的 SKILL.md 骨架（references/ 目录留空待写）：
- foundation: pnpm/tsdown/vitest/eslint/unocss
- react: 核心 hooks + 组件模式 + RSC + 并发特性
- nextjs: App Router + data fetching + Server Actions + RSC patterns
- tanstack: Router/Query/Form
- ui: StyleX + antd v6 + UnoCSS
- data-and-forms: tRPC/zod/zustand/msw/react-hook-form
- testing: Vitest + Playwright + Storybook
- preferences: 个人项目结构/命名/提交规范

顶层 skills/SKILL.md 作为 agent 加载本仓库的入口索引。"

git status -s
```

Expected: `git status -s` 输出为空（仅剩 `skills/antfu/`、`skills/antfu-design/`、`meta.ts` 已提交、scripts 已提交）。

---

## Task 9: 重写 `AGENTS.md`

**Files:**
- Modify: `AGENTS.md`（全文重写）

- [ ] **Step 1: 写入新 `AGENTS.md`**

```markdown
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
```

- [ ] **Step 2: 验证文件**

```bash
test -f AGENTS.md && head -1 AGENTS.md
```

Expected: 输出 `# Skills 编写约定（React 栈）`。

- [ ] **Step 3: 暂不提交**（与 Task 10 一起提交「文档阶段」commit）

---

## Task 10: 重写 `README.md`

**Files:**
- Modify: `README.md`（全文重写）

- [ ] **Step 1: 写入新 `README.md`**

```markdown
# React 栈 Agent Skills

为 React 技术栈定制的 [Agent Skills](https://agentskills.io/home) 集合。

> 本仓库是 [antfu/skills](https://github.com/antfu/skills) 的 fork，已改造为 React 栈版本，长期独立维护。

## 技术栈覆盖

- **框架**：Next.js（App Router）、TanStack Router
- **样式 / UI**：StyleX、Ant Design v6、UnoCSS
- **状态 / 数据**：TanStack Query、Zustand、tRPC、zod、MSW
- **测试**：Vitest、Playwright、Storybook
- **底座**：pnpm、tsdown、antfu eslint config

## 安装

```bash
# 当前项目
pnpx skills add jhongxu/skills --skill='*'

# 全局
pnpx skills add jhongxu/skills --skill='*' -g
```

挑选加载：

```bash
pnpx skills add jhongxu/skills --skill='nextjs,tanstack,data-and-forms,testing'
```

## Skill 列表

### 手写 Skills

| Skill | 说明 |
|-------|------|
| [foundation](skills/foundation) | pnpm / tsdown / vitest / eslint / unocss |
| [react](skills/react) | React 核心 API 与模式 |
| [nextjs](skills/nextjs) | Next.js App Router / RSC / Server Actions |
| [tanstack](skills/tanstack) | TanStack Router / Query / Form |
| [ui](skills/ui) | StyleX / antd v6 / UnoCSS |
| [data-and-forms](skills/data-and-forms) | tRPC / zod / zustand / msw / react-hook-form |
| [testing](skills/testing) | Vitest / Playwright / Storybook |
| [preferences](skills/preferences) | 个人项目结构 / 命名 / 提交规范 |

### 同步自 [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)

| Skill | 说明 |
|-------|------|
| react-best-practices | React 最佳实践（Vercel 维护） |
| composition-patterns | 组件组合模式 |
| web-design-guidelines | Web 设计规范 |

## 维护

```bash
pnpm install
pnpm start check    # 查看 vendor 是否有上游更新
pnpm start sync     # 拉取并更新 vendor skill
pnpm start lint     # 校验所有 SKILL.md frontmatter
pnpm start cleanup  # 清理 orphan skill
```

新增手写 skill 见 [AGENTS.md](AGENTS.md)。

## License

MIT（见 [LICENSE.md](LICENSE.md)）。
```

- [ ] **Step 2: 验证**

```bash
head -3 README.md
```

Expected: 输出 `# React 栈 Agent Skills`。

- [ ] **Step 3: 提交「文档阶段」**

```bash
git add AGENTS.md README.md
git commit -m "docs: rewrite README and AGENTS for React stack

- README: 替换为 React 栈项目介绍、技术栈覆盖、安装方式、skill 列表
- AGENTS.md: 替换为 React 栈 skill 编写约定（与新 meta.ts 对齐）"

git status -s
```

---

## Task 11: 重写 `package.json`

**Files:**
- Modify: `package.json`（精简）

- [ ] **Step 1: 写入新 `package.json`**

```json
{
  "type": "module",
  "private": true,
  "packageManager": "pnpm@10.32.1",
  "scripts": {
    "lint": "eslint .",
    "start": "node scripts/cli.ts"
  },
  "devDependencies": {
    "@clack/prompts": "^1.1.0",
    "@types/node": "^25.5.0",
    "typescript": "^5.9.3"
  }
}
```

注：移除 `@antfu/eslint-config`、`eslint`、`simple-git-hooks`、`lint-staged`（不再需要 pre-commit）；移除 `pnpm prepare`（不再 `git submodule update`）。

- [ ] **Step 2: 同步 lockfile**

```bash
pnpm install
```

Expected: pnpm 重新生成 lockfile，可能新增/删除依赖项。命令成功（exit 0）。

- [ ] **Step 3: 验证 pnpm start 仍可用**

```bash
pnpm start --help 2>&1 | head -3 || pnpm start 2>&1 | head -3
```

Expected: 看到 clack prompts 的菜单或「Command required」之类的合理输出。

- [ ] **Step 4: 提交**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(package): drop eslint + pre-commit deps, simplify scripts

- 移除 @antfu/eslint-config, eslint, simple-git-hooks, lint-staged
- 移除 prepare 脚本（不再 submodule update）
- 仅保留 @clack/prompts + typescript/node types"
```

---

## Task 12: 删除 2 个旧 antfu 手写 skill

**Files:**
- Delete: `skills/antfu/`
- Delete: `skills/antfu-design/`

旧 antfu 那 2 个是 Vue 生态的偏好，与新 React 栈偏好（`skills/preferences`）冲突。删除避免双套。

- [ ] **Step 1: 删除**

```bash
rm -rf skills/antfu skills/antfu-design
```

- [ ] **Step 2: 验证 skills/ 现在 8 + 顶层 SKILL.md = 9 个条目（8 个手写 skill 目录）**

```bash
ls skills/
```

Expected: 8 个手写 skill 目录 + `SKILL.md` 顶层文件（如果有 `SKILL.md` 会一并列出）。

- [ ] **Step 3: 跑 lint**

```bash
pnpm start lint
```

Expected: `All 8 skills pass lint`。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "chore: remove old antfu/antfu-design skills (Vue-focused)

旧 antfu/antfu-design 是 Vue 生态偏好；React 栈偏好已由
skills/preferences 承担。删除避免双套偏好。"

git status -s
```

---

## Task 13: 跑 `pnpm start sync` 拉取 3 个 React vendor skill

**Files:**
- Create: `skills/react-best-practices/`（含 SKILL.md, AGENTS.md, rules/, README.md, metadata.json, SYNC.md）
- Create: `skills/composition-patterns/`
- Create: `skills/web-design-guidelines/`

- [ ] **Step 1: 跑 sync**

```bash
pnpm start sync
```

Expected: 输出 `Synced: react-best-practices → react-best-practices`、`Synced: composition-patterns → composition-patterns`、`Synced: web-design-guidelines → web-design-guidelines`、`All skills synced`。

- [ ] **Step 2: 验证 3 个 skill 目录已生成**

```bash
ls skills/react-best-practices/
ls skills/composition-patterns/
ls skills/web-design-guidelines/
```

Expected: 每个目录含 SYNC.md 加上游原文件。

- [ ] **Step 3: 检查 SYNC.md SHA 正确**

```bash
cat skills/react-best-practices/SYNC.md
```

Expected: 含 `Git SHA: <40位hex>`。

- [ ] **Step 4: 跑 lint**

```bash
pnpm start lint
```

Expected: `All 11 skills pass lint`（8 手写 + 3 vendor）。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat(vendor): sync 3 React skills from vercel-labs/agent-skills

- react-best-practices (Vercel 维护的 React 最佳实践)
- composition-patterns (组件组合模式)
- web-design-guidelines (Web 设计规范)"

git status -s
```

---

## Task 14: 终检

- [ ] **Step 1: 跑 `pnpm start cleanup -y`**

```bash
pnpm start cleanup -y
```

Expected: `No orphan skills found` 或 `Everything is clean`。

- [ ] **Step 2: 跑 `pnpm start check`**

```bash
pnpm start check
```

Expected: `All vendor submodules are up to date` 或列出 `vendor/web-design-guidelines` 落后几个 commit（可能，因我们没拉过最新）。

- [ ] **Step 3: 跑 `pnpm start lint`**

```bash
pnpm start lint
```

Expected: `All 11 skills pass lint`。

- [ ] **Step 4: 跑 TS 编译**

```bash
pnpm exec tsc --noEmit
```

Expected: 0 errors。

- [ ] **Step 5: 跑 pnpm lint（如果保留）**

如果 Task 11 后 `package.json` 仍有 `lint: eslint .`，且本仓库没有 eslint 配置（`eslint.config.js` 已删除或保留），这个命令可能失败。如失败可忽略或在最终 commit 中 `rm eslint.config.js`。

```bash
pnpm run lint 2>&1 | tail -5 || echo "lint skipped (no eslint config)"
```

- [ ] **Step 6: 检查整体目录结构**

```bash
ls -la
echo "---"
ls skills/
```

Expected: 根目录无 `sources/`、`vendor/`（除了 web-design-guidelines）、`instructions/`、`pnpm-workspace.yaml`；`skills/` 列出 8 个手写 + 3 个 vendor = 11 个目录。

- [ ] **Step 7: 最终 commit（如有未提交改动）**

```bash
git add -A
if [ -n "$(git status -s)" ]; then
  git commit -m "chore: final cleanup and verification"
else
  echo "No changes to commit"
fi
```

---

## 收尾

完成后应满足：

- [ ] 仓库根无 `sources/`、`instructions/`、`pnpm-workspace.yaml`
- [ ] `vendor/` 仅剩 `web-design-guidelines/`
- [ ] `skills/` 含 11 个目录（8 手写 + 3 vendor）+ 顶层 `SKILL.md`
- [ ] `pnpm start lint` 11 个全过
- [ ] `pnpm exec tsc --noEmit` 0 错误
- [ ] 所有改动已提交，`git status` 干净

---

## 自检结果

执行后已在脑中跑了一遍 self-review：

- **Spec 覆盖**：spec 第 3 节所有删除/改造/新增条目 → Task 1-14 覆盖。
- **Placeholder 扫描**：plan 中无 TBD / TODO / "implement later"；每个 markdown 模板给出完整内容。
- **类型一致**：cli.ts 内的 `getExpectedSkillNames()` 与 `meta.ts` 的 `manual + vendors` 字段结构一致；`getExistingSkillNames()` 返回的 `string[]` 与 `Set<string>` 比较正确。
- **唯一发现的小问题**：Task 11 跑 `pnpm install` 时 lockfile 变动 → 已在 Step 2 写明。
