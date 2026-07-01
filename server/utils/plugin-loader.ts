import { useStorage } from 'nitro/storage'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import type { McpAuthor } from '../types/mcp'
import type { PluginEntry, PluginIcon } from '../types/plugin'
import type { SkillConfig } from '../types/skill'

let cache: PluginEntry[] | null = null

const bundledPluginAssetPrefixes = ['skills:', 'scripts:', 'assets:', 'references:', 'commands:', 'agents:', 'src:']
const bundledPluginAssetFiles = ['hooks.json', 'package.json']

function normalizeAuthor(raw: any): McpAuthor {
  if (raw && typeof raw === 'object' && 'name' in raw) {
    return { name: String(raw.name ?? ''), email: String(raw.email ?? '') }
  }
  return { name: String(raw ?? ''), email: '' }
}

function normalizeIcon(raw: any): PluginIcon | undefined {
  if (!raw) return undefined
  if (typeof raw === 'string') return { kind: 'external_url', url: raw }
  if (typeof raw !== 'object') return undefined
  const kind = String(raw.kind ?? '').trim()
  if (kind === 'builtin' && raw.name) {
    return { kind, name: String(raw.name) }
  }
  if (kind === 'external_url' && raw.url) {
    return { kind, url: String(raw.url) }
  }
  return undefined
}

async function readBundledSkills(pluginID: string): Promise<SkillConfig[]> {
  const storage = useStorage('assets/plugins')
  const allKeys = await storage.getKeys()
  const prefix = `${pluginID}:skills:`
  const skillIds = new Set<string>()

  for (const key of allKeys) {
    if (!key.startsWith(prefix)) continue
    const parts = key.substring(prefix.length).split(':')
    if (parts[0]) skillIds.add(parts[0])
  }

  const skills: SkillConfig[] = []
  for (const skillID of skillIds) {
    const baseKey = `${prefix}${skillID}:`
    const skillMdKey = `${baseKey}SKILL.md`
    const text = (await storage.getItem(skillMdKey)) as string
    if (!text) continue
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
    const data = frontmatter ? (parseYaml(frontmatter[1]) as Record<string, any>) : {}
    const content = frontmatter ? frontmatter[2] : text
    const files = allKeys
      .filter((key) => key.startsWith(baseKey))
      .map((key) => key.substring(baseKey.length).replaceAll(':', '/'))
    const author = normalizeAuthor(data.metadata?.author)
    skills.push({
      id: skillID,
      name: data.name ?? skillID,
      description: data.description ?? '',
      metadata: {
        author,
        tags: data.metadata?.tags,
        homepage: data.metadata?.homepage,
      },
      content: content.trim(),
      files,
    })
  }
  return skills
}

async function scanExplicitPlugins(): Promise<PluginEntry[]> {
  const storage = useStorage('assets/plugins')
  const allKeys = await storage.getKeys()
  const manifestKeys = allKeys.filter((key) => key.endsWith(':plugin.yaml') || key === 'plugin.yaml')
  const plugins: PluginEntry[] = []

  for (const key of manifestKeys) {
    try {
      const id = key.replace(':plugin.yaml', '').replace('plugin.yaml', '')
      if (!id) continue
      const text = (await storage.getItem(key)) as string
      if (!text) continue
      const data = parseYaml(text) as Record<string, any>
      const author = normalizeAuthor(data.author)
      const entry: PluginEntry = {
        ...data,
        id: data.id ?? id,
        schema_version: String(data.schema_version ?? '1'),
        version: String(data.version ?? '0.1.0'),
        author,
        icon: normalizeIcon(data.icon),
        bundled_skills: await readBundledSkills(id),
      } as PluginEntry
      plugins.push(entry)
    } catch {
      // skip invalid plugin entries
    }
  }

  return plugins
}

async function scanPlugins(): Promise<PluginEntry[]> {
  const explicit = await scanExplicitPlugins()
  return explicit.sort((a, b) => a.name.localeCompare(b.name))
}

async function getCache(): Promise<PluginEntry[]> {
  if (!cache) {
    cache = await scanPlugins()
  }
  return cache
}

export function invalidatePluginCache() {
  cache = null
}

export async function getAllPlugins(options?: {
  q?: string
  tag?: string
  page?: number
  limit?: number
}) {
  const all = await getCache()
  let filtered = all

  if (options?.tag) {
    const tag = options.tag.toLowerCase()
    filtered = filtered.filter((plugin) => plugin.tags?.some((item) => item.toLowerCase() === tag))
  }

  if (options?.q) {
    const q = options.q.toLowerCase()
    filtered = filtered.filter(
      (plugin) =>
        plugin.name.toLowerCase().includes(q) ||
        plugin.description.toLowerCase().includes(q) ||
        plugin.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
        plugin.capabilities?.some((capability) => capability.toLowerCase().includes(q)),
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

export async function getPluginById(id: string): Promise<PluginEntry | undefined> {
  const all = await getCache()
  return all.find((plugin) => plugin.id === id)
}

export async function getAllPluginTags(): Promise<string[]> {
  const all = await getCache()
  const tags = new Set<string>()
  for (const plugin of all) {
    if (plugin.tags) {
      for (const tag of plugin.tags) tags.add(tag)
    }
  }
  return [...tags].sort()
}

export async function getPluginFiles(id: string): Promise<Record<string, Uint8Array>> {
  const plugin = await getPluginById(id)
  if (!plugin) return {}

  const encoder = new TextEncoder()
  const { bundled_skills: _bundledSkills, ...manifest } = plugin
  const files: Record<string, Uint8Array> = {
    'plugin.yaml': encoder.encode(stringifyYaml(manifest)),
  }

  const storage = useStorage('assets/plugins')
  const allKeys = await storage.getKeys()
  const pluginPrefix = `${id}:`
  for (const key of allKeys) {
    if (!key.startsWith(pluginPrefix)) continue
    const pluginRelativeKey = key.substring(pluginPrefix.length)
    if (
      !bundledPluginAssetFiles.includes(pluginRelativeKey) &&
      !bundledPluginAssetPrefixes.some((prefix) => pluginRelativeKey.startsWith(prefix))
    ) {
      continue
    }
    const relativePath = pluginRelativeKey.replaceAll(':', '/')
    const raw = await storage.getItemRaw(key)
    if (raw instanceof Uint8Array) {
      files[relativePath] = raw
    } else if (raw instanceof ArrayBuffer) {
      files[relativePath] = new Uint8Array(raw)
    } else if (typeof raw === 'string') {
      files[relativePath] = encoder.encode(raw)
    } else if (raw != null) {
      files[relativePath] = encoder.encode(String(raw))
    }
  }

  return files
}
