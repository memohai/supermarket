import { useStorage } from 'nitro/storage'
import { parse as parseYaml } from 'yaml'
import type { SkillAuthor, SkillConfig } from '../types/skill'

function normalizeAuthor(raw: any): SkillAuthor {
  if (raw && typeof raw === 'object' && 'name' in raw) {
    return { name: String(raw.name ?? ''), email: String(raw.email ?? '') }
  }
  return { name: String(raw ?? ''), email: '' }
}

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

      const authorRaw = data.metadata?.author
      const author = normalizeAuthor(authorRaw)
      if (!author.email && data.metadata?.author_email) {
        author.email = String(data.metadata.author_email)
      }

      results.push({
        id,
        name: data.name ?? id,
        description: data.description ?? '',
        metadata: {
          author,
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
  tag?: string
  page?: number
  limit?: number
}) {
  const all = await getCache()
  let filtered = all

  if (options?.tag) {
    const tag = options.tag.toLowerCase()
    filtered = filtered.filter((s) => s.metadata.tags?.some((t) => t.toLowerCase() === tag))
  }

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

export async function getAllSkillTags(): Promise<string[]> {
  const all = await getCache()
  const tags = new Set<string>()
  for (const s of all) {
    if (s.metadata.tags) {
      for (const t of s.metadata.tags) tags.add(t)
    }
  }
  return [...tags].sort()
}

export async function getSkillFiles(id: string): Promise<Record<string, Uint8Array>> {
  const storage = useStorage('assets/skills')
  const allKeys = await storage.getKeys()
  const prefix = `${id}:`
  const files: Record<string, Uint8Array> = {}
  const encoder = new TextEncoder()

  for (const key of allKeys) {
    if (!key.startsWith(prefix)) continue
    const relativePath = key.substring(prefix.length).replaceAll(':', '/')
    const raw = await storage.getItemRaw(key)
    if (raw != null) {
      if (raw instanceof Uint8Array) {
        files[relativePath] = raw
      } else if (raw instanceof ArrayBuffer) {
        files[relativePath] = new Uint8Array(raw)
      } else if (typeof raw === 'string') {
        files[relativePath] = encoder.encode(raw)
      } else {
        files[relativePath] = encoder.encode(String(raw))
      }
    }
  }

  return files
}
