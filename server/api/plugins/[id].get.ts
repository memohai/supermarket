import { defineHandler, HTTPError } from 'nitro'
import { getRouterParam } from 'h3'
import { getPluginById } from '../../utils/plugin-loader'

export default defineHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const plugin = await getPluginById(id)
  if (!plugin) {
    throw new HTTPError(`Plugin "${id}" not found`, { statusCode: 404 })
  }

  return plugin
})

