import type { McpAuthor } from './mcp'
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

export interface PluginConfigVar {
  key: string
  description: string
  defaultValue?: string
  required?: boolean
  secret?: boolean
  options?: Array<{
    label?: string
    value: string
  }>
}

export interface PluginMcpResourceBase {
  key: string
  transport: 'http' | 'sse' | 'stdio'
  description: string
  env?: PluginConfigVar[]
  auth_ref?: string
  visibility?: 'hidden' | 'visible'
  capabilities?: string[]
  allowed_tools?: string[]
  display_name?: string
}

export interface PluginMcpHTTPResource extends PluginMcpResourceBase {
  transport: 'http'
  url: string
  headers?: PluginConfigVar[]
}

export interface PluginMcpSSEResource extends PluginMcpResourceBase {
  transport: 'sse'
  url: string
  headers?: PluginConfigVar[]
}

export interface PluginMcpStdioResource extends PluginMcpResourceBase {
  transport: 'stdio'
  command: string
  args?: string[]
}

export type PluginMcpResource =
  | PluginMcpHTTPResource
  | PluginMcpSSEResource
  | PluginMcpStdioResource

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
  variables?: PluginConfigVar[]
  auth_requirements?: PluginAuthRequirement[]
  mcps?: PluginMcpResource[]
  skills?: PluginSkillResource[]
}

export interface PluginEntry extends PluginConfig {
  bundled_skills?: SkillConfig[]
}
