import { defineHandler, HTTPError } from 'nitro'
import { getRouterParam, setResponseHeader } from 'h3'
import { getPluginById, getPluginFiles } from '../../../utils/plugin-loader'
import { createTar, gzip } from '../../../utils/tar'

export default defineHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const plugin = await getPluginById(id)
  if (!plugin) {
    throw new HTTPError(`Plugin "${id}" not found`, { statusCode: 404 })
  }

  const files = await getPluginFiles(id)
  const tar = createTar(files, id)
  const compressed = await gzip(tar)

  setResponseHeader(event, 'content-type', 'application/gzip')
  setResponseHeader(event, 'content-disposition', `attachment; filename="${id}.tar.gz"`)
  return compressed
})

