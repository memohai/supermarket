import { useStorage } from 'nitro/storage'
import { parse as parseYaml } from 'yaml'
import type { SkillConfig } from '../types/skill'

function parseFrontmatter(text: string): { data: Record<string, any>; content: string } {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { data: {}, content: text }
  return { data: parseYaml(match[1]) as Record<string, any>, content: match[2] }
}

let cache: SkillConfig[] | null = null

async function scanSkills(): Promise<SkillConfig[]> {
  const results: SkillConfig[] = []
  const storage = useStorage('assets/skills')

  const allKeys = await storage.getKeys()

  const skillIds = new Set<string>()
  for (const key of allKeys) {
    const sep = key.indexOf(':')
    if (sep > 0) {
      skillIds.add(key.substring(0, sep))
    }
  }

  for (const id of skillIds) {
    try {
      const skillMdKey = `${id}:SKILL.md`
      const text = (await storage.getItem(skillMdKey)) as string
      if (!text) continue

      const { data, content } = parseFrontmatter(text)

      const files = allKeys
        .filter((k) => k.startsWith(`${id}:`))
        .map((k) => k.substring(id.length + 1).replaceAll(':', '/'))

      results.push({
        id,
        name: data.name ?? id,
        description: data.description ?? '',
        metadata: {
          author: data.metadata?.author ?? '',
          author_email: data.metadata?.author_email ?? '',
          tags: data.metadata?.tags,
          homepage: data.metadata?.homepage,
        },
        content: content.trim(),
        files,
      })
    } catch {
      // skip invalid entries
    }
  }

  return results
}

async function getCache(): Promise<SkillConfig[]> {
  if (!cache) {
    cache = await scanSkills()
  }
  return cache
}

export function invalidateSkillCache() {
  cache = null
}

export async function getAllSkills(options?: {
  q?: string
  page?: number
  limit?: number
}) {
  const all = await getCache()
  let filtered = all

  if (options?.q) {
    const q = options.q.toLowerCase()
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.metadata.tags?.some((t) => t.toLowerCase().includes(q)),
    )
  }

  const page = options?.page ?? 1
  const limit = options?.limit ?? 20
  const start = (page - 1) * limit

  return {
    total: filtered.length,
    page,
    limit,
    data: filtered.slice(start, start + limit),
  }
}

export async function getSkillById(id: string): Promise<SkillConfig | undefined> {
  const all = await getCache()
  return all.find((s) => s.id === id)
}

export async function getSkillFiles(id: string): Promise<Record<string, string>> {
  const storage = useStorage('assets/skills')
  const allKeys = await storage.getKeys()
  const prefix = `${id}:`
  const files: Record<string, string> = {}

  for (const key of allKeys) {
    if (!key.startsWith(prefix)) continue
    const relativePath = key.substring(prefix.length).replaceAll(':', '/')
    const content = (await storage.getItem(key)) as string
    if (content != null) {
      files[relativePath] = content
    }
  }

  return files
}
