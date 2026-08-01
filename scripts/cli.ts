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

const RE_GITMODULES_PATH = /path\s*=\s*(.+)/g
const RE_FRONTMATTER_NAME = /^name:\s*\S/m
const RE_FRONTMATTER_DESCRIPTION = /^description:\s*\S/m

function _getExistingSubmodulePaths(): string[] {
  const gitmodules = join(root, '.gitmodules')
  if (!existsSync(gitmodules))
    return []
  const content = readFileSync(gitmodules, 'utf-8')
  const matches = content.matchAll(RE_GITMODULES_PATH)
  return Array.from(matches, match => match[1].trim())
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
  if (!RE_FRONTMATTER_NAME.test(block)) {
    return { valid: false, reason: 'missing `name:` field' }
  }
  if (!RE_FRONTMATTER_DESCRIPTION.test(block)) {
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
    if (!existsSync(skillPath)) {
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
    case 'sync':
      await syncSubmodules()
      break
    case 'check':
      await checkUpdates()
      break
    case 'lint':
      lintSkills()
      break
    case 'cleanup':
      await cleanup()
      break
  }
  p.outro('Done')
}

main().catch(console.error)
