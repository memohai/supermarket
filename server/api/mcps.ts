import { defineHandler, HTTPError } from 'nitro'

export default defineHandler(() => {
  throw new HTTPError('Standalone MCP registry is no longer available', { statusCode: 404 })
})
