import { defineHandler } from 'nitro'
import { getQuery } from 'h3'
import { getAllMcps } from '../../utils/mcp-loader'

export default defineHandler(async (event) => {
  const query = getQuery(event)

  return getAllMcps({
    q: query.q as string | undefined,
    tag: query.tag as string | undefined,
    transport: query.transport as string | undefined,
    page: query.page ? Number(query.page) : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
  })
})
