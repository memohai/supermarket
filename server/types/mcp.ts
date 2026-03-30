export interface McpConfigVar {
  key: string
  description: string
  defaultValue?: string
}

export interface McpAuthor {
  name: string
  email: string
}

export interface McpBase {
  name: string
  description: string
  author: McpAuthor
  icon?: string
  homepage?: string
  tags?: string[]
  env?: McpConfigVar[]
}

export interface McpSSE extends McpBase {
  transport: 'sse'
  url: string
  headers?: McpConfigVar[]
}

export interface McpHTTP extends McpBase {
  transport: 'http'
  url: string
  headers?: McpConfigVar[]
}

export interface McpStdio extends McpBase {
  transport: 'stdio'
  command: string
  args?: string[]
}

export type McpConfig = McpSSE | McpHTTP | McpStdio

export interface McpEntry extends McpConfig {
  id: string
}
