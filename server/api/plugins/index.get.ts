import { defineHandler } from 'nitro'
import { getQuery } from 'h3'
import { getAllPlugins } from '../../utils/plugin-loader'

export default defineHandler(async (event) => {
  const query = getQuery(event)

  return getAllPlugins({
    q: query.q as string | undefined,
    tag: query.tag as string | undefined,
    page: query.page ? Number(query.page) : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
  })
})

