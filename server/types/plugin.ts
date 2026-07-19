import type { McpConfig, McpConfigVar, McpAuthor } from './mcp'
import type { SkillConfig } from './skill'

export type PluginIcon =
  | { kind: 'builtin'; name: string }
  | { kind: 'external_url'; url: string }

export type PluginAuthType = 'none' | 'managed_oauth' | 'user_secret'

export interface PluginAuthRequirement {
  key: string
  type: PluginAuthType
  client_ref?: string
  scopes?: string[]
  variables?: string[]
}

export interface PluginMcpResource extends McpConfig {
  key: string
  auth_ref?: string
  visibility?: 'hidden' | 'visible'
  capabilities?: string[]
  display_name?: string
}

export interface PluginSkillResource {
  key: string
  name?: string
  path: string
}

export interface PluginConfig {
  schema_version: string
  id: string
  name: string
  version: string
  description: string
  author: McpAuthor
  icon?: PluginIcon
  homepage?: string
  tags?: string[]
  capabilities?: string[]
  install?: string | string[]
  variables?: McpConfigVar[]
  auth_requirements?: PluginAuthRequirement[]
  mcps?: PluginMcpResource[]
  skills?: PluginSkillResource[]
}

export interface PluginEntry extends PluginConfig {
  bundled_skills?: SkillConfig[]
}
