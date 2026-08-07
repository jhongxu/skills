# pnpm

> 面向 `pnpm@11.19`（pnpm 12 在 beta）。pnpm 11 起所有非 auth/registry 的设置都迁到 `pnpm-workspace.yaml`，`.npmrc` 只剩鉴权与 registry。React 栈默认用它管 workspace 与依赖版本。

为什么是 pnpm 而不是 npm/yarn：硬链接 + 虚拟 store 省磁盘、严格 node_modules（默认不提升，避免幽灵依赖）、原生 workspace、catalogs 统一版本。tsdown / vitest / @antfu/eslint-config 的安装命令也都以 `pnpm` 为首选。

## 1. 安装与启用

```bash
# Node 20+ 自带 corepack，开箱即用
corepack enable
corepack prepare pnpm@latest --activate

# 或独立安装
npm i -g pnpm
```

在仓库根放一个 `package.json` 的 `packageManager` 字段锁定版本（corepack 会读它）：

```jsonc
{
  "name": "my-app",
  "packageManager": "pnpm@11.19.0",
  "engines": { "node": ">=20" }
}
```

## 2. Workspace（monorepo）

`pnpm-workspace.yaml` 声明哪些目录是子包：

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
  # 排除
  - '!**/test/**'
```

子包之间用 `workspace:` 协议互引（pnpm 11.19 起支持 bare `workspace:`，等价于 `workspace:*`，发布时解析为具体版本）：

```jsonc
// packages/ui/package.json
{
  "name": "@my/ui",
  "dependencies": {
    "@my/utils": "workspace:*",   // 推荐：版本跟随被依赖包
    "@my/types": "workspace:"     // bare 形式，等价于 workspace:*
  }
}
```

`workspace:*` / `workspace:^` / `workspace:~` 在 **publish** 时被替换成 `package.json` 里写的具体版本（`workspace:^1.2.3` → `^1.2.3`）。想在发布时保留 `workspace:` 字面量？没有这个选项，`pnpm publish` 一定会替换。

### 常用命令

```bash
pnpm i                        # 安装整个 workspace
pnpm i react                  # 加到 root（不推荐，除非是 dev tool）
pnpm --filter @my/ui add react      # 只给某个子包加依赖
pnpm -r add zod               # 给所有子包加
pnpm --filter @my/ui... build       # 给 ui 及其依赖的子包跑 build（注意三个点）
pnpm -r run build             # 所有子包跑 build（并行）
pnpm -r --parallel run dev    # 并行跑 dev（长任务）
pnpm -r --filter=!@my/e2e test     # 排除某包
```

`--filter` 语法：`--filter <pkg>` 选包；`--filter <pkg>...` 含其依赖；`--filter ...^<pkg>` 含其依赖者；`--filter ./apps/*` 按 glob 选路径。

## 3. Catalogs（统一版本，最重要）

monorepo 里同一个依赖被多个子包引用，版本易飘。catalog 把版本号抽到 `pnpm-workspace.yaml`，`package.json` 里写 `catalog:` 引用它。升级只改一处。

### 默认 catalog

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'

catalog:
  react: ^19.2.0
  'react-dom': ^19.2.0
  zod: ^3.25.0
```

```jsonc
// packages/app/package.json
{
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:",
    "zod": "catalog:"
  }
}
```

`catalog:` 是 `catalog:default` 的简写。

### 命名 catalog（多版本并存）

迁移期或不同子包需要不同版本时用：

```yaml
# pnpm-workspace.yaml
catalogs:
  react18:
    react: ^18.3.1
    'react-dom': ^18.3.1
  react19:
    react: ^19.2.0
    'react-dom': ^19.2.0
```

```jsonc
// packages/legacy/package.json
{ "dependencies": { "react": "catalog:react18" } }
// packages/new/package.json
{ "dependencies": { "react": "catalog:react19" } }
```

### 哪里能用 `catalog:`

- `package.json` 的 `dependencies` / `devDependencies` / `peerDependencies` / `optionalDependencies`
- `pnpm-workspace.yaml` 的 `overrides`

### catalogMode（控制 `pnpm add` 行为）

```yaml
# pnpm-workspace.yaml
catalogMode: strict   # strict | prefer | manual（默认 manual）
```

- `strict`：`pnpm add` 只接受 catalog 里已有的版本，版本不在范围内直接报错
- `prefer`：优先用 catalog 版本，找不到兼容版才降级到直接依赖
- `manual`：不自动往 catalog 里加

想清理没用的 catalog 项：

```yaml
cleanupUnusedCatalogs: true   # install 时自动删
```

### `pnpm dlx` 也支持 catalog（11.x）

```bash
pnpm dlx shx@catalog:        # 用 catalog 里 shx 的版本跑一次性命令
```

### 迁移已有 workspace 到 catalog

```bash
pnpx codemod pnpm/catalog    # 自动把 package.json 里的版本号抽到 catalog
```

## 4. 设置全在 `pnpm-workspace.yaml`

pnpm 11 起 `.npmrc` **只剩 auth 和 registry**，其余设置（`hoistPattern`、`nodeLinker`、`shamefullyHoist`、`minimumReleaseAge` 等）必须写在 `pnpm-workspace.yaml`。这是从 `.npmrc` 迁移时最大的认知变化。

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'

# === 依赖解析 ===
nodeLinker: isolated         # isolated（默认，虚拟 store）| hoisted | pnp
shamefullyHoist: false       # true = 把所有依赖提到 node_modules 顶层（兼容旧工具）
hoistPattern:
  - '*eslint*'
  - '*prettier*'

# === 安全（推荐开启）===
minimumReleaseAge: 7d        # 只安装发布满 7 天的版本，防投毒与坏版本
minimumReleaseAgeExclude:
  - '@my-org/*'              # 内部包不等
# allowBuilds: pnpm 默认禁止依赖跑 install 脚本（防供应链攻击），白名单在这里
allowBuilds:
  - 'esbuild'                # 确定安全的才放开
  - 'sharp'

# === 版本写入 ===
savePrefix: ^                # pnpm add 默认存的 range 操作符；11.19 起也接受 =（存成 =1.2.3）
saveWorkspaceProtocol: rolling  # rolling（默认，存成 workspace:^ 不带版本）| true（存具体版本）| false

# === catalog ===
catalogMode: manual
cleanupUnusedCatalogs: false

# === update / audit（11.15+ 新结构，取代 updateConfig / auditConfig / 顶层 auditLevel）===
update:
  ignoreDeps:
    - webpack
    - '@babel/*'
  githubActions: true         # pnpm outdated/update 也检查 .github/workflows 里的 actions
  changeset: false            # true = update 时自动写 changeset
audit:
  level: high                 # low | moderate | high | critical
  ignore:
    - 'GHSA-xxxx-yyyy-zzzz'
```

> 旧的 `updateConfig.*` / `auditConfig.*` / 顶层 `auditLevel` 在 11.19 仍能用，但会打 deprecation warning，新项目直接用 `update` / `audit` 段。

## 5. `overrides`（强制版本）

整个 workspace 范围内强制某个依赖的版本（修安全洞、统一传递依赖）：

```yaml
# pnpm-workspace.yaml
overrides:
  lodash: ^4.17.21
  'react': catalog:react19    # 也能用 catalog:
  '@babel/core': '7.25.0'     # 钉死
```

`overrides` 里同样支持 `catalog:` 协议（11.x 已修通过 pnpr server 解析的 bug）。

## 6. publish

`workspace:` 与 `catalog:` 在 `pnpm publish` / `pnpm pack` 时都会被替换成具体版本：

```jsonc
// 发布前
{ "dependencies": { "react": "catalog:react19", "@my/utils": "workspace:*" } }
// 发布产物
{ "dependencies": { "react": "^19.2.0", "@my/utils": "^1.4.0" } }
```

11.15+ 新增 `publishConfig.name`：发布时改名，不污染 workspace 内的引用。

```jsonc
{
  "name": "@my/ui-internal",
  "publishConfig": { "name": "@my/ui", "access": "public" }
}
```

## 7. 常用命令速查

```bash
pnpm why react                # 为什么装了 react / 谁依赖它
pnpm list react --depth 3     # 看依赖树
pnpm outdated                 # 看哪些包过期（加 --include-github-actions 也查 GHA）
pnpm update --interactive     # 交互式升级
pnpm update --latest          # 跨大版本升级（默认只 minor/patch）
pnpm update --changeset       # 升级同时写 changeset（11.15+）
pnpm audit                    # 查安全漏洞
pnpm audit --fix              # 自动修
pnpm prune                    # 清 store 里没被引用的包
pnpm store path               # 看 store 位置
pnpm deploy --filter=@my/app dist  # 把 app 及其依赖聚到 dist 部署
pnpm pack                     # 打 tarball（会触发 workspace:/catalog: 替换）
```

## 8. 与本仓库其他 skill 的衔接

- 配 [tsdown](tsdown.md) 打包库：`pnpm add -D tsdown`，CI 用 pnpm 装依赖后跑 `pnpm build`。
- 配 [vitest](vitest.md)：`pnpm add -D vitest`，workspace 下 `pnpm -r test` 并行跑所有子包测试。
- 配 [eslint-antfu](eslint-antfu.md)：`pnpm add -D eslint @antfu/eslint-config`。
- 配 [unocss](unocss.md)：`pnpm add -D unocss @unocss/preset-wind4`。
- React / TanStack / nuqs 等 skill 的安装命令都默认写 `pnpm add`。

## 9. 坑

| 坑 | 说明 |
|----|------|
| `.npmrc` 里写 `shamefully-hoist=true` 不生效 | 11 起 `.npmrc` 不再读非 auth 设置，改写到 `pnpm-workspace.yaml` 的 `shamefullyHoist: true` |
| `workspace:` 协议发布后还在 | `pnpm publish` 一定替换；本地 `pnpm pack` 看 tarball 内容验证 |
| `catalog:` 在 `overrides` 里不解析 | 旧版 bug，升到 11.x；pnpr server 路径也已修 |
| install 脚本没跑（esbuild/sharp 报错） | pnpm 默认禁 build 脚本，在 `allowBuilds` 白名单加包名 |
| 新版本装不上、被 `minimumReleaseAge` 挡 | 临时 `pnpm i --config.minimumReleaseAge=0` 或调短 |
| `pnpm self-update` 在 workspace 里失败 | 11.19 起 self-update 不再读项目设置（防被项目 config 劫持），用全局配置或环境变量控制 |
| 子包间类型丢失 | 确保被依赖包的 `package.json` 有 `types`/`exports` 字段且 `tsconfig` 路径对得上 |
