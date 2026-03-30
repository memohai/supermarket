import { useStorage } from 'nitro/storage'
import { parse as parseYaml } from 'yaml'
import type { McpAuthor, McpConfig, McpEntry } from '../types/mcp'

let cache: McpEntry[] | null = null

function normalizeAuthor(raw: any): McpAuthor {
  if (raw && typeof raw === 'object' && 'name' in raw) {
    return { name: String(raw.name ?? ''), email: String(raw.email ?? '') }
  }
  return { name: String(raw ?? ''), email: '' }
}

async function scanMcps(): Promise<McpEntry[]> {
  const entries: McpEntry[] = []
  const storage = useStorage('assets/mcps')

  const allKeys = await storage.getKeys()
  const yamlKeys = allKeys.filter((k) => k.endsWith(':mcp.yaml') || k === 'mcp.yaml')

  for (const key of yamlKeys) {
    try {
      const id = key.replace(':mcp.yaml', '').replace('mcp.yaml', '')
      if (!id) continue
      const text = (await storage.getItem(key)) as string
      if (!text) continue
      const data = parseYaml(text) as Record<string, any>
      const author = normalizeAuthor(data.author)
      if (!author.email && data.author_email) {
        author.email = String(data.author_email)
      }
      const { author_email: _, ...rest } = data
      entries.push({ ...rest, author, id } as McpEntry)
    } catch {
      // skip invalid entries
    }
  }

  return entries
}

async function getCache(): Promise<McpEntry[]> {
  if (!cache) {
    cache = await scanMcps()
  }
  return cache
}

export function invalidateMcpCache() {
  cache = null
}

export async function getAllMcps(options?: {
  q?: string
  tag?: string
  transport?: string
  page?: number
  limit?: number
}) {
  const all = await getCache()
  let filtered = all

  if (options?.transport) {
    filtered = filtered.filter((m) => m.transport === options.transport)
  }

  if (options?.tag) {
    const tag = options.tag.toLowerCase()
    filtered = filtered.filter((m) => m.tags?.some((t) => t.toLowerCase() === tag))
  }

  if (options?.q) {
    const q = options.q.toLowerCase()
    filtered = filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.tags?.some((t) => t.toLowerCase().includes(q)),
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

export async function getMcpById(id: string): Promise<McpEntry | undefined> {
  const all = await getCache()
  return all.find((m) => m.id === id)
}

export async function getAllMcpTags(): Promise<string[]> {
  const all = await getCache()
  const tags = new Set<string>()
  for (const m of all) {
    if (m.tags) {
      for (const t of m.tags) tags.add(t)
    }
  }
  return [...tags].sort()
}
