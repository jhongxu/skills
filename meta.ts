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
  'nuqs',
  'stylex',
  'ui',
  'data-and-forms',
  'testing',
  'preferences',
]
